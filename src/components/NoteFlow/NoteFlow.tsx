import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  RotateCcw, 
  ArrowUp, 
  Check, 
  Zap, 
  Trash2, 
  Sparkles,
  ChevronRight,
  Maximize2,
  X,
  Database,
  Globe,
  Type,
  ChevronLeft
} from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import { vectorStore } from '../../lib/vectorStore';
import { cn } from '@/src/lib/utils';
import Markdown from 'react-markdown';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface NoteflowProps {
  user: any;
  theme?: 'light' | 'dark';
  onBack?: () => void;
}

interface Source {
  page_number: number;
  score: number;
  text_snippet: string;
  image_path?: string;
}

export function NoteFlow({ user, theme, onBack }: NoteflowProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, sources?: Source[] }[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setIsPdfLoaded(false);
      setIndexStatus('');
    }
  };

  const ingestPdf = async () => {
    if (!uploadedFile) return;

    setIsIndexing(true);
    setIndexStatus(`Reading ${uploadedFile.name}...`);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const ids: string[] = [];
      const embeddings: any[] = [];
      const metadatas: any[] = [];
      const documents: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setIndexStatus(`Embedding page ${i}/${totalPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');

        // Render page to canvas for multimodal embedding
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ 
            canvasContext: context, 
            viewport: viewport,
            // @ts-ignore - some versions require the canvas element
            canvas: canvas 
          }).promise;
          const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

          // Create multimodal embedding
          const result = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: [{
              parts: [
                { text: text },
                { inlineData: { data: imageBase64, mimeType: 'image/png' } }
              ]
            }],
            config: {
              taskType: "RETRIEVAL_DOCUMENT" as any,
              outputDimensionality: 512
            }
          });

          ids.push(`newflow-${uploadedFile.name}-${i}`);
          embeddings.push(result.embeddings[0].values);
          metadatas.push({
            page_number: i,
            pdf_name: uploadedFile.name,
            type: 'pdf_page'
          });
          documents.push(text.substring(0, 1000));
        }
      }

      // Upsert to Chroma
      await vectorStore.upsert('newflow_knowledge', documents, metadatas, ids);
      
      setIsPdfLoaded(true);
      setIndexStatus(`Successfully indexed ${totalPages} pages`);
    } catch (error) {
      console.error('Ingest failed:', error);
      setIndexStatus('Ingest failed. Check console.');
    } finally {
      setIsIndexing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !isPdfLoaded) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // 1. Embed question
      const embedResult = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [{ parts: [{ text: userMessage }] }],
        config: {
          taskType: "RETRIEVAL_QUERY" as any,
          outputDimensionality: 512
        }
      });

      // 2. Search Chroma
      const results = await vectorStore.query('newflow_knowledge', userMessage, 5);
      
      const contextParts: string[] = [];
      const sources: Source[] = [];

      if (results.documents[0]) {
        results.documents[0].forEach((doc: string, i: number) => {
          const meta = results.metadatas[0][i];
          const dist = results.distances[0][i];
          const pageNum = meta?.page_number || '?';
          
          contextParts.push(`[Page ${pageNum}]\n${doc}`);
          sources.push({
            page_number: pageNum,
            score: Math.round((1 - dist) * 100),
            text_snippet: doc.substring(0, 350)
          });
        });
      }

      const context = contextParts.join('\n\n---\n\n');

      // 3. Generate answer
      const systemPrompt = `You are a helpful Noteflow Assistant. Answer the user's question based ONLY on the provided manual pages. 
Be concise and clear. Use numbered steps when explaining procedures. Mention relevant page numbers in your answer.

Manual content:
${context}

Question: ${userMessage}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: systemPrompt
      });
      const answer = response.text || "";

      setMessages(prev => [...prev, { role: 'assistant', content: answer, sources }]);
    } catch (error) {
      console.error('RAG failed:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error processing your request." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-[#1a1a1a] p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-text-dim hover:text-text-main flex items-center justify-center gap-2 border border-white/5 text-xs font-bold uppercase tracking-widest"
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </button>
          )}
          <div 
            className="space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onBack}
          >
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
              <FileText className="text-emerald-500" />
              Noteflow
            </h2>
            <p className="text-xs text-text-dim">Multimodal RAG Assistant</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim">Load Manual</h3>
            <label className="block w-full py-8 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 transition-all cursor-pointer relative">
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Plus size={24} className="text-text-dim" />
              <span className="text-xs font-medium text-text-dim">Drop PDF here</span>
            </label>
            
            {uploadedFile && (
              <div className="space-y-2">
                <p className="text-xs font-bold truncate">{uploadedFile.name}</p>
                <p className="text-[10px] text-text-dim">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                <button 
                  onClick={ingestPdf}
                  disabled={isIndexing || isPdfLoaded}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isIndexing ? <RotateCcw size={14} className="animate-spin" /> : <Zap size={14} />}
                  {isIndexing ? "Indexing..." : isPdfLoaded ? "Indexed" : "Index PDF"}
                </button>
              </div>
            )}
          </div>

          {indexStatus && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] text-emerald-500 font-medium animate-pulse">{indexStatus}</p>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => setMessages([])}
            className="w-full py-2 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            Clear Chat
          </button>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-text-dim leading-relaxed">
              Embeddings: Gemini Multimodal<br />
              Generation: GPT-5.4 (Gemini 3.1 Pro)<br />
              Store: ChromaDB
            </p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-bg/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold">Multimodal RAG</h3>
              <p className="text-xs text-text-dim">
                {isPdfLoaded ? `Loaded: ${uploadedFile?.name}` : "Upload a PDF to get started"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Sparkles size={48} className="text-emerald-500" />
              <div className="space-y-2">
                <h4 className="text-xl font-serif">Welcome to Noteflow</h4>
                <p className="text-sm max-w-xs">Upload your technical manuals or documents to start a multimodal conversation.</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <motion.div 
              key={`msg-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-6", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                msg.role === 'assistant' ? "bg-emerald-500 text-white" : "bg-white/10 text-text-muted"
              )}>
                {msg.role === 'assistant' ? "NF" : "U"}
              </div>
              <div className="space-y-4 max-w-[80%]">
                <div className={cn(
                  "p-5 rounded-2xl text-sm leading-relaxed shadow-xl",
                  msg.role === 'assistant' ? "bg-[#242424] border border-white/5" : "bg-emerald-600 text-white"
                )}>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, sIdx) => (
                      <div key={`source-${source.page_number}-${sIdx}`} className="group relative">
                        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-medium flex items-center gap-2 hover:bg-white/10 transition-all cursor-help">
                          <span className="text-emerald-500">Page {source.page_number}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">{source.score}%</span>
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                          <p className="text-[10px] text-text-dim italic leading-relaxed line-clamp-4">
                            {source.text_snippet}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isGenerating && (
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">NF</div>
              <div className="bg-[#242424] p-5 rounded-2xl border border-white/5 flex gap-2 items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8 bg-gradient-to-t from-bg via-bg to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isPdfLoaded ? "Ask anything about the manual..." : "Please upload and index a PDF first"}
              disabled={!isPdfLoaded || isGenerating}
              className="w-full bg-[#242424] border border-white/10 rounded-2xl px-6 py-5 outline-none focus:border-emerald-500/50 transition-all pr-20 shadow-2xl disabled:opacity-50"
            />
            <button 
              onClick={sendMessage}
              disabled={!isPdfLoaded || isGenerating || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <ArrowUp size={24} />
            </button>
          </div>
          <p className="text-[10px] text-center text-text-dim mt-4">
            Newflow uses multimodal embeddings to understand both text and diagrams in your documents.
          </p>
        </div>
      </main>
    </div>
  );
}
