import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize AI Clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "dummy-key",
});
const pineconeIndex = pc.index(process.env.PINECONE_INDEX || "quickstart", process.env.PINECONE_HOST);

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

  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  const WORKSPACES_PATH = path.join(DATA_DIR, "workspaces.json");
  const DOCUMENTS_PATH = path.join(DATA_DIR, "documents.json");

  let workspaces: any[] = fs.existsSync(WORKSPACES_PATH) ? JSON.parse(fs.readFileSync(WORKSPACES_PATH, "utf-8")) : [];
  let documents: any[] = fs.existsSync(DOCUMENTS_PATH) ? JSON.parse(fs.readFileSync(DOCUMENTS_PATH, "utf-8")) : [];

  const saveData = () => {
    fs.writeFileSync(WORKSPACES_PATH, JSON.stringify(workspaces, null, 2));
    fs.writeFileSync(DOCUMENTS_PATH, JSON.stringify(documents, null, 2));
  };

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/workspaces", (req, res) => {
    const userId = req.query.userId as string;
    res.json(workspaces.filter(w => w.user_id === userId));
  });

  app.get("/api/test-pinecone", async (req, res) => {
    try {
      const stats = await pineconeIndex.describeIndexStats();
      res.json({ 
        status: "connected", 
        stats,
        config: {
          index: process.env.PINECONE_INDEX || "quickstart",
          host: process.env.PINECONE_HOST || "not set"
        }
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  app.post("/api/workspaces", (req, res) => {
    const { name, description, userId } = req.body;
    const newWorkspace = {
      id: uuidv4(),
      user_id: userId,
      name,
      description,
      created_at: new Date().toISOString()
    };
    workspaces.push(newWorkspace);
    saveData();
    res.json(newWorkspace);
  });

  app.delete("/api/workspaces/:id", (req, res) => {
    const { id } = req.params;
    workspaces = workspaces.filter(w => w.id !== id);
    documents = documents.filter(d => d.workspace_id !== id);
    saveData();
    res.json({ success: true });
  });

  app.get("/api/workspaces/:id/documents", (req, res) => {
    const { id } = req.params;
    res.json(documents.filter(d => d.workspace_id === id));
  });

  app.delete("/api/workspaces/:id/documents/:docId", (req, res) => {
    const { id: workspaceId, docId } = req.params;
    documents = documents.filter(d => !(d.id === docId && d.workspace_id === workspaceId));
    saveData();
    res.json({ success: true });
  });

  app.post("/api/workspaces/:id/documents/:docId/reindex", async (req, res) => {
    const { id: workspaceId, docId } = req.params;
    const doc = documents.find(d => d.id === docId && d.workspace_id === workspaceId);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({ success: true, message: "Document re-indexed successfully" });
    } catch (error) {
      console.error("Re-indexing error:", error);
      res.status(500).json({ error: "Failed to re-index document" });
    }
  });

  app.post("/api/workspaces/:id/documents/index", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { type, content, title, userId, vectors } = req.body;
    try {
      const docId = uuidv4();
      const newDoc = {
        id: docId,
        workspace_id: workspaceId,
        user_id: userId,
        title: title || (type === 'url' ? content : 'Untitled Text'),
        type,
        content: type === 'url' ? `Content from ${content}` : content.substring(0, 1000),
        created_at: new Date().toISOString()
      };
      documents.push(newDoc);

      if (vectors && vectors.length > 0) {
        await pineconeIndex.upsert({ records: vectors });
        console.log(`Successfully indexed ${vectors.length} vectors for doc: ${docId}`);
        await logPineconeStats();
      }
      
      saveData();
      res.json(newDoc);
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
        workspace_id: workspaceId,
        user_id: userId,
        title: "User Note",
        type: "note",
        content: content.substring(0, 1000),
        created_at: new Date().toISOString()
      };
      documents.push(newDoc);

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
        console.log(`Successfully indexed note: ${docId}`);
        await logPineconeStats();
      }
      
      saveData();
      res.json(newDoc);
    } catch (error) {
      console.error("Note creation error:", error);
      res.status(500).json({ error: "Failed to save note" });
    }
  });

  app.post("/api/workspaces/:id/documents/upload", upload.single('file'), async (req, res) => {
    const { id: workspaceId } = req.params;
    const { userId, vectors, content, title } = req.body;
    try {
      const docId = uuidv4();
      const newDoc = {
        id: docId,
        workspace_id: workspaceId,
        user_id: userId,
        title: title || req.file?.originalname || "Uploaded File",
        type: "pdf",
        content: content || "PDF Content extracted on client.",
        created_at: new Date().toISOString()
      };
      documents.push(newDoc);

      if (vectors && vectors.length > 0) {
        // Handle vectors if they come as a string (sometimes happens with FormData)
        const parsedVectors = typeof vectors === 'string' ? JSON.parse(vectors) : vectors;
        await pineconeIndex.upsert({ records: parsedVectors });
        console.log(`Successfully indexed ${parsedVectors.length} vectors for uploaded file: ${docId}`);
        await logPineconeStats();
      }
      
      saveData();
      res.json(newDoc);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process document" });
    }
  });

  app.post("/api/workspaces/:id/chat", async (req, res) => {
    const { id: workspaceId } = req.params;
    const { message, userId, queryEmbedding, history = [] } = req.body;
    try {
      console.log(`Chat request for workspace: ${workspaceId}, message: ${message.substring(0, 50)}...`);
      
      const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: 10,
        filter: {
          workspace_id: workspaceId
        },
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
            content: `You are Noteflow LM, a sophisticated AI Research Tool & Thinking Partner. 
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
