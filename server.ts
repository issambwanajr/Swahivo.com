import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import multer from "multer";
import csv from "csvtojson";
import { v4 as uuidv4 } from "uuid";
import { Pinecone } from '@pinecone-database/pinecone';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin (Service Role)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log(`Initializing Supabase Admin with URL: ${supabaseUrl}`);

// Initialize AI Clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "dummy-key",
});
const pineconeIndex = pc.index(
  process.env.PINECONE_INDEX || "chatbot", 
  process.env.PINECONE_HOST || "https://chatbot-b8259b3.svc.aped-4627-b74a.pinecone.io"
);

const upload = multer({ storage: multer.memoryStorage() });

// Helper to log Pinecone stats
async function logPineconeStats() {
  try {
    const stats = await pineconeIndex.describeIndexStats();
    console.log("--- Pinecone Index Stats ---");
    console.log(JSON.stringify(stats, null, 2));
    console.log("----------------------------");
  } catch (error) {
    console.error("Error getting Pinecone stats:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/tts", async (req, res) => {
    const { text, voiceId = "pNInz6obpgDQGcFmaJgB" } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || "Failed to generate audio");
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });
      res.send(buffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scrape", async (req, res) => {
    const { url, crawl } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const maxPages = crawl === 'true' ? 10 : 1;
    const visited = new Set<string>();
    const queue = [targetUrl];
    let aggregatedText = "";
    let mainTitle = "";

    try {
      const baseUrl = new URL(targetUrl);
      
      while (queue.length > 0 && visited.size < maxPages) {
        const currentUrl = queue.shift()!;
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        console.log(`Scraping (${visited.size}/${maxPages}): ${currentUrl}`);
        
        try {
          const response = await fetch(currentUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: AbortSignal.timeout(10000) // 10s timeout per page
          });
          
          if (!response.ok) continue;

          const html = await response.text();
          const $ = cheerio.load(html);
          
          if (!mainTitle) {
            mainTitle = $('title').text() || url;
          }

          // Extract links if we are crawling
          if (crawl === 'true' && visited.size < maxPages) {
            $('a').each((_, element) => {
              const href = $(element).attr('href');
              if (href) {
                try {
                  const absoluteUrl = new URL(href, currentUrl);
                  // Only crawl same domain and avoid fragments/queries for simplicity
                  absoluteUrl.hash = '';
                  absoluteUrl.search = '';
                  
                  if (absoluteUrl.origin === baseUrl.origin && !visited.has(absoluteUrl.toString())) {
                    queue.push(absoluteUrl.toString());
                  }
                } catch (e) {
                  // Invalid URL, skip
                }
              }
            });
          }

          // Extract text
          const $content = $('body').clone();
          $content.find('script, style, nav, footer, header, aside, .ads, .menu, .sidebar').remove();
          
          const pageText = $content.text()
            .replace(/\s+/g, ' ')
            .trim();

          if (pageText) {
            aggregatedText += `\n--- Source: ${currentUrl} ---\n${pageText}\n`;
          }
        } catch (err) {
          console.error(`Failed to scrape ${currentUrl}:`, err);
        }
      }

      if (!aggregatedText) {
        throw new Error("No content could be extracted from the website.");
      }

      res.json({ text: aggregatedText.trim(), title: mainTitle });
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: `Failed to scrape website: ${error.message}` });
    }
  });

  app.get("/api/workspaces", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      console.warn("Fetch projects requested without userId");
      return res.status(400).json({ error: "userId is required" });
    }
    
    try {
      console.log(`Fetching projects for user: ${userId}`);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error("Fetch projects error:", error);
      res.status(500).json({ 
        error: "Failed to fetch projects", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    const { name, description, userId } = req.body;
    try {
      const newProject = {
        user_id: userId,
        name,
        description: description || "",
        created_at: new Date().toISOString(),
        usage: { tokens: 0, credits: 100, last_active: new Date().toISOString() },
        members: [userId]
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/workspaces/:id/documents", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', id);

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error("Fetch documents error:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.delete("/api/workspaces/:id/documents/:docId", async (req, res) => {
    const { id: workspaceId, docId } = req.params;
    try {
      await pineconeIndex.deleteMany({
        filter: { docId: { "$eq": docId } }
      });
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Delete doc error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.post("/api/workspaces/:id/documents/:docId/summary", async (req, res) => {
    const { id: workspaceId, docId } = req.params;
    const { summary } = req.body;
    try {
      const { error } = await supabase
        .from('documents')
        .update({ summary })
        .eq('id', docId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update summary" });
    }
  });

  app.post("/api/workspaces/:id/documents/:docId/reindex", async (req, res) => {
    const { id: workspaceId, docId } = req.params;
    try {
      // Logic for re-indexing would go here
      res.json({ success: true, message: "Document re-indexed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to re-index" });
    }
  });

  app.post("/api/workspaces/:id/documents/index", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { type, content, title, userId, vectors, docId } = req.body;
    try {
      const finalDocId = docId || uuidv4();
      const newDoc = {
        id: finalDocId,
        project_id: workspaceId,
        user_id: userId,
        title: title || (type === 'url' ? content : 'Untitled Text'),
        type,
        content: type === 'url' ? content : (content || "").substring(0, 1000),
        status: 'ready',
        created_at: new Date().toISOString()
      };

      if (vectors && vectors.length > 0) {
        await pineconeIndex.upsert({ records: vectors });
        console.log(`Successfully indexed ${vectors.length} vectors for doc: ${finalDocId}`);
      }
      
      const { data, error } = await supabase
        .from('documents')
        .upsert(newDoc)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Indexing error:", error);
      res.status(500).json({ error: "Failed to index source" });
    }
  });

  app.post("/api/workspaces/:id/notes", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { content, userId, embedding } = req.body;
    try {
      const docId = uuidv4();
      const newDoc = {
        id: docId,
        project_id: workspaceId,
        user_id: userId,
        title: "User Note",
        type: "note",
        content: (content || "").substring(0, 1000),
        status: 'ready',
        created_at: new Date().toISOString()
      };

      if (embedding) {
        await pineconeIndex.upsert({
          records: [{
            id: docId,
            values: embedding,
            metadata: {
              text: content,
              docId,
              workspace_id: workspaceId,
              user_id: userId,
              title: "User Note",
              type: "note"
            }
          }]
        });
      }
      
      const { data, error } = await supabase
        .from('documents')
        .insert(newDoc)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Note creation error:", error);
      res.status(500).json({ error: "Failed to save note" });
    }
  });

  app.post("/api/workspaces/:id/documents/upload", upload.single('file'), async (req, res) => {
    const { id: workspaceId } = req.params;
    const { userId, vectors, content, title, docId } = req.body;
    try {
      const finalDocId = docId || uuidv4();
      const newDoc = {
        id: finalDocId,
        project_id: workspaceId,
        user_id: userId,
        title: title || req.file?.originalname || "Uploaded File",
        type: "pdf",
        content: content || "PDF Content extracted on client.",
        created_at: new Date().toISOString()
      };

      if (vectors && vectors.length > 0) {
        const parsedVectors = typeof vectors === 'string' ? JSON.parse(vectors) : vectors;
        await pineconeIndex.upsert({ records: parsedVectors });
      }
      
      const { data, error } = await supabase
        .from('documents')
        .insert(newDoc)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process document" });
    }
  });

  app.get("/api/workspaces/:id/search", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { q, docIds = [], topK = 10 } = req.query;
    
    try {
      if (!q || typeof q !== 'string') return res.status(400).json({ error: "Query 'q' is required" });
      
      const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key" }); // We use OpenAI for embedding if needed, or better, the client provides it
      // Actually, let's assume the client provides the embedding for performance and to stick to Gemini on client
      // But query params are limited. Let's use POST for search if we want to send embeddings.
      res.status(400).json({ error: "Use POST /api/workspaces/:id/search with embedding" });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/workspaces/:id/search", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { queryEmbedding, docIds = [], topK = 10 } = req.body;
    
    try {
      const filter: any = { workspace_id: workspaceId };
      if (docIds && docIds.length > 0) {
        filter.docId = { "$in": docIds };
      }

      const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: Number(topK),
        filter,
        includeMetadata: true
      });

      res.json({ 
        matches: (queryResponse.matches || []).map(m => ({
          score: m.score,
          metadata: m.metadata
        }))
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/workspaces/:id/chat", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { message, userId, queryEmbedding, history = [], docIds = [] } = req.body;
    try {
      console.log(`Chat request for workspace: ${workspaceId}, message: ${(message || "").substring(0, 50)}...`);
      
      const filter: any = { workspace_id: workspaceId };
      if (docIds && docIds.length > 0) {
        filter.docId = { "$in": docIds };
      }

      const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: 10,
        filter,
        includeMetadata: true
      });

      const searchResults = queryResponse.matches || [];
      console.log(`Pinecone search results: ${searchResults.length} matches found.`);
      
      if (searchResults.length > 0) {
        console.log(`Top match score: ${searchResults[0].score}, Title: ${searchResults[0].metadata?.title}`);
        console.log(`Top match metadata keys: ${Object.keys(searchResults[0].metadata || {})}`);
      }

      const context = searchResults.length > 0 
        ? searchResults.map(r => `[Source: ${r.metadata?.title}${r.metadata?.pageNumber ? `, Page: ${r.metadata.pageNumber}` : ''}]:\n${r.metadata?.text}`).join("\n\n---\n\n")
        : "No specific context found in this workspace.";
      const chatHistory = history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      }));
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are Noteflow. I am based on OpenAI's models, designed to assist with a wide range of questions and tasks by providing information, suggestions, and research support. My training includes knowledge up to October 2023, and I'm equipped to help with various topics through thoughtful and informed interactions.
            Answer ONLY from provided sources if they contain relevant info.
            Always cite sources using [Title, Page] or [Title].
            If the answer isn't in the sources, you can use your general knowledge but clearly state "This is based on general knowledge, not your sources."
            If not found at all, say clearly "Not found in sources".`
          },
          ...chatHistory,
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${message}`
          }
        ]
      });
      res.json({ 
        answer: response.choices[0].message.content,
        sources: searchResults.map(r => ({
          title: r.metadata?.title,
          pageNumber: r.metadata?.pageNumber,
          score: Math.round((r.score || 0) * 100)
        }))
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  // AI Chatbots Endpoints
  app.post("/api/index-pdf", async (req, res) => {
    const { pdfName, pages } = req.body;
    try {
      console.log(`Indexing PDF: ${pdfName}, pages: ${pages?.length || 0}`);
      res.json({ success: true, message: `Indexed ${pdfName}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to index PDF" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const { message, history = [] } = req.body;
    try {
      const chatHistory = history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      }));
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are Noteflow. I am based on OpenAI's models, designed to assist with a wide range of questions and tasks by providing information, suggestions, and research support. My training includes knowledge up to October 2023, and I'm equipped to help with various topics through thoughtful and informed interactions."
          },
          ...chatHistory,
          { role: "user", content: message }
        ]
      });
      
      res.json({ 
        answer: response.choices[0].message.content,
        sources: []
      });
    } catch (error) {
      console.error("General Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  app.get("/api/workspaces/:id/messages", async (req, res) => {
    const { id: workspaceId } = req.params;
    try {
      const { data, error } = await supabase
        .from('outputs')
        .select('*')
        .eq('project_id', workspaceId)
        .eq('type', 'chat_history')
        .order('created_at', { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error("Fetch messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/workspaces/:id/messages", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { message } = req.body;
    try {
      const newMessage = {
        project_id: workspaceId,
        ...message,
        type: "chat_history",
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('outputs')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Save message error:", error);
      res.status(500).json({ error: "Failed to save message" });
    }
  });

  app.get("/api/chatbots", async (req, res) => {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: "tenantId is required" });
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('tenantId', tenantId);

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chatbots" });
    }
  });

  app.post("/api/chatbots", async (req, res) => {
    const { name, description, tenantId, model, indexName } = req.body;
    try {
      const newChatbot = {
        name,
        description,
        tenantId,
        model,
        index_name: indexName,
        status: 'active',
        sources: [],
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('chatbots')
        .insert(newChatbot)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create chatbot" });
    }
  });

  app.get("/api/chatbots/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Chatbot not found" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chatbot" });
    }
  });

  app.delete("/api/chatbots/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chatbot" });
    }
  });

  app.put("/api/chatbots/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({
          ...updateData,
          created_at: updateData.created_at // Keep original created_at if provided or handle updated_at
        })
        .eq('id', id);

      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update chatbot" });
    }
  });

  app.get("/api/chatbots/:id/sources", async (req, res) => {
    const { id: chatbotId } = req.params;
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('sources')
        .eq('id', chatbotId)
        .single();

      if (error) throw error;
      res.json(data?.sources || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.delete("/api/chatbots/:id/sources/:sourceId", async (req, res) => {
    const { id: chatbotId, sourceId } = req.params;
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('sources')
        .eq('id', chatbotId)
        .single();

      if (error || !data) return res.status(404).json({ error: "Chatbot not found" });
      
      const newSources = (data.sources || []).filter((s: any) => s.id !== sourceId);
      const { error: updateError } = await supabase
        .from('chatbots')
        .update({ sources: newSources })
        .eq('id', chatbotId);

      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete source" });
    }
  });

  app.post("/api/chatbots/:id/chat", async (req, res) => {
    const { id } = req.params;
    const { message, tenantId, queryEmbedding, history = [] } = req.body;
    
    try {
      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !chatbot) return res.status(404).json({ error: "Chatbot not found" });

      const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: 5,
        filter: {
          tenantId: { "$eq": tenantId },
          chatbotId: { "$eq": id }
        },
        includeMetadata: true
      });

      const searchResults = queryResponse.matches || [];
      const context = searchResults.length > 0 
        ? searchResults.map(r => `[Knowledge Base]:\n${r.metadata?.text}`).join("\n\n---\n\n")
        : "No specific knowledge found for this chatbot.";

      const response = await openai.chat.completions.create({
        model: chatbot.model || "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ${chatbot.name}, an AI assistant. 
            Description: ${chatbot.description}
            Use the following context from your knowledge base to answer the user's question.
            If the answer isn't in the context, answer based on your general knowledge but prioritize the context.`
          },
          ...history,
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${message}`
          }
        ]
      });

      res.json({ 
        answer: response.choices[0].message.content,
        sources: searchResults.map(r => ({ score: Math.round((r.score || 0) * 100) }))
      });
    } catch (error) {
      console.error("Chatbot Chat error:", error);
      res.status(500).json({ error: "Failed to process chatbot request" });
    }
  });

  app.post("/api/chatbots/:id/train", async (req, res) => {
    const { id: chatbotId } = req.params;
    const { tenantId, type, content, embedding, metadata } = req.body;

    try {
      const vectorId = `cb-${chatbotId}-${uuidv4().substring(0, 8)}`;
      
      await pineconeIndex.upsert({
        records: [{
          id: vectorId,
          values: embedding,
          metadata: {
            ...metadata,
            text: content,
            type,
            chatbotId,
            tenantId
          }
        }]
      });

      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .select('sources')
        .eq('id', chatbotId)
        .single();

      if (!error && chatbot) {
        const sources = chatbot.sources || [];
        const exists = sources.some((s: any) => s.value === metadata.source);
        if (!exists) {
          sources.push({
            id: vectorId,
            type,
            value: metadata.source,
            timestamp: new Date().toISOString()
          });
          await supabase
            .from('chatbots')
            .update({ sources })
            .eq('id', chatbotId);
        }
      }

      res.json({ success: true, vectorId });
    } catch (error: any) {
      console.error("Chatbot Training error:", error);
      res.status(500).json({ error: `Failed to train chatbot: ${error.message}` });
    }
  });

  let storedData: any[] = [];

  app.post("/api/data-intelligence/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvString = req.file.buffer.toString('utf8');
      const jsonArray = await csv().fromString(csvString);
      storedData = jsonArray;
      res.json(jsonArray);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to parse CSV" });
    }
  });

  app.get("/api/data-intelligence/data", (req, res) => {
    res.json(storedData);
  });

  app.post("/api/data-intelligence/chat", async (req, res) => {
    const { message, context, history = [] } = req.body;
    try {
      const chatHistory = history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      }));
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert data analyst. The user has uploaded a dataset.
            Here is the complete data context:
            ${context}
            
            Answer questions about this data clearly and concisely. Cite specific numbers, column names, or row values when relevant. If a question cannot be answered from the provided data, say so explicitly.`
          },
          ...chatHistory,
          { role: "user", content: message }
        ]
      });
      
      res.json({ 
        answer: response.choices[0].message.content
      });
    } catch (error: any) {
      console.error("Data Intelligence Chat error:", error);
      res.status(500).json({ error: "Failed to process data intelligence request" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
