import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Globe, 
  Type, 
  Send, 
  Loader2, 
  ChevronRight, 
  BookOpen, 
  MessageSquare,
  Sparkles,
  X,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FilePlus,
  StickyNote,
  Bot,
  Database,
  TrendingUp,
  ShieldAlert,
  Target,
  BarChart3,
  AudioLines
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project, WorkspaceDocument, User } from '../../types';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';
import { getEmbedding, batchGetEmbeddings, summarizeText, getAgentPlan, synthesizeAnswer, rerankResults } from '../../services/geminiService';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface NoteFlowWorkspaceProps {
  user: User;
  project: Project;
  onBack: () => void;
  onHome: () => void;
}

const MISSION_TEMPLATES = [
  {
    id: 'competitive',
    title: 'Competitive Landscape',
    description: 'Identify key players, market positions, and competitive advantages.',
    prompt: 'Summarize the competitive landscape based on these sources. Identify the key players mentioned, their core market positions, and any specific competitive advantages or weaknesses discussed.',
    icon: <Target size={18} />
  },
  {
    id: 'regulatory',
    title: 'Regulatory Changes',
    description: 'Analyze policy shifts, compliance requirements, and legal impacts.',
    prompt: 'Analyze all regulatory changes and policy shifts mentioned in these documents. What are the primary compliance requirements and potential legal or operational impacts for our organization?',
    icon: <ShieldAlert size={18} />
  },
  {
    id: 'executive',
    title: 'Executive Summary',
    description: 'High-level synthesis of critical findings and strategic insights.',
    prompt: 'Create a high-level executive summary of all uploaded sources. Focus on the most critical findings, strategic insights, and recommended next steps based on the evidence provided.',
    icon: <FileText size={18} />
  },
  {
    id: 'project',
    title: 'Project Template',
    description: 'Generate a structured research project plan based on the materials.',
    prompt: 'Based on these sources, generate a structured research project plan. Include a problem statement, research objectives, key methodology points, and a proposed timeline for further investigation.',
    icon: <Database size={18} />
  }
];

export function NoteFlowWorkspace({ user, project, onBack, onHome }: NoteFlowWorkspaceProps) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string, sources?: any[] }[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentSteps, setAgentSteps] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<WorkspaceDocument | null>(null);
  const [isAddSourceMenuOpen, setIsAddSourceMenuOpen] = useState(false);
  const [isIndexingSource, setIsIndexingSource] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sourceType, setSourceType] = useState<'pdf' | 'url' | 'text' | 'note' | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sourceInput, setSourceInput] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [shouldCrawl, setShouldCrawl] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchMessages();
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/workspaces/${project.id}/documents`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/workspaces/${project.id}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const saveMessage = async (message: any) => {
    try {
      await fetch(`/api/workspaces/${project.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const docId = uuidv4();
    const tempDoc: WorkspaceDocument = {
      id: docId,
      project_id: project.id,
      user_id: user.id,
      title: file.name,
      type: 'pdf',
      content: '',
      status: 'indexing',
      created_at: new Date().toISOString()
    };
    setDocuments(prev => [...prev, tempDoc]);
    setIsUploading(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      const chunks = fullText.match(/[\s\S]{1,1500}/g) || [];
      const embeddings = await batchGetEmbeddings(chunks);
      const vectors = chunks.map((chunk, i) => {
        return {
          id: `${docId}-c${i}`,
          values: embeddings[i],
          metadata: {
            text: chunk,
            docId,
            project_id: project.id,
            user_id: user.id,
            title: file.name,
            type: 'pdf',
            pageNumber: Math.floor(i / 2) + 1
          }
        };
      });

      const res = await fetch(`/api/workspaces/${project.id}/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docId,
          userId: user.id, 
          vectors, 
          content: (fullText || "").substring(0, 1000),
          title: file.name
        })
      });
      const newDoc = await res.json();
      setDocuments(prev => prev.map(d => d.id === docId ? { ...newDoc, status: 'ready' } : d));
    } catch (err) {
      console.error("Upload failed:", err);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
    } finally {
      setIsUploading(false);
    }
  };

  const handleIndexSource = async () => {
    if (!sourceType) return;
    if (sourceType === 'url' && !sourceInput.trim()) return;
    if ((sourceType === 'text' || sourceType === 'note') && !sourceInput.trim()) return;

    const docId = uuidv4();
    const tempDoc: WorkspaceDocument = {
      id: docId,
      project_id: project.id,
      user_id: user.id,
      title: sourceTitle || (sourceType === 'url' ? sourceInput : sourceType === 'note' ? 'My Note' : 'Untitled Text'),
      type: sourceType,
      content: '',
      status: 'indexing',
      created_at: new Date().toISOString()
    };
    
    setDocuments(prev => [...prev, tempDoc]);
    setIsUploading(true);
    setSourceType(null); // Close modal/form early for better UX

    try {
      let textToIndex = sourceInput;
      let finalTitle = sourceTitle || (sourceType === 'note' ? 'My Note' : (sourceInput || "").substring(0, 30));

      if (sourceType === 'url') {
        const scrapeRes = await fetch(`/api/scrape?url=${encodeURIComponent(sourceInput)}&crawl=${shouldCrawl}`);
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          textToIndex = scrapeData.text;
          finalTitle = sourceTitle || scrapeData.title;
        } else {
          textToIndex = `This is a website source from ${sourceInput}. Full content could not be fetched.`;
        }
      }

      const chunks = textToIndex.match(/[\s\S]{1,1500}/g) || [];
      const embeddings = await batchGetEmbeddings(chunks);
      const vectors = chunks.map((chunk, i) => {
        return {
          id: `${docId}-c${i}`,
          values: embeddings[i],
          metadata: {
            text: chunk,
            docId,
            project_id: project.id,
            user_id: user.id,
            title: finalTitle,
            type: sourceType
          }
        };
      });

      const endpoint = sourceType === 'note' ? `/api/workspaces/${project.id}/notes` : `/api/workspaces/${project.id}/documents/index`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docId,
          type: sourceType, 
          content: sourceType === 'url' ? textToIndex : sourceInput, 
          title: finalTitle,
          userId: user.id,
          vectors,
          embedding: sourceType === 'note' ? vectors[0].values : undefined
        })
      });
      const newDoc = await res.json();
      setDocuments(prev => prev.map(d => d.id === docId ? { ...newDoc, status: 'ready' } : d));
      setSourceInput('');
      setSourceTitle('');
    } catch (err) {
      console.error("Indexing failed:", err);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarizeSource = async () => {
    if (!activeSource) return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeText(activeSource.content);
      const updatedDoc = { ...activeSource, summary };
      
      // Update local state
      setDocuments(documents.map(d => d.id === activeSource.id ? updatedDoc : d));
      setActiveSource(updatedDoc);
      
      // Update backend
      await fetch(`/api/workspaces/${project.id}/documents/${activeSource.id}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary })
      });
    } catch (err) {
      console.error("Summarization failed:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleReindex = async (docId: string) => {
    setIsIndexingSource(docId);
    try {
      await fetch(`/api/workspaces/${project.id}/documents/${docId}/reindex`, {
        method: 'POST'
      });
      // Just a visual feedback for now
      setTimeout(() => setIsIndexingSource(null), 1000);
    } catch (err) {
      console.error("Re-indexing failed:", err);
      setIsIndexingSource(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`/api/workspaces/${project.id}/documents/${docId}`, {
        method: 'DELETE'
      });
      setDocuments(documents.filter(d => d.id !== docId));
      if (activeSource?.id === docId) setActiveSource(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleIndexAll = async () => {
    // In a real app, this would trigger a project-wide indexing job
    setIsUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      fetchDocuments();
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string') e?.preventDefault();
    
    const messageText = typeof e === 'string' ? e : (input.trim() || "");
    if (!messageText && !input.trim()) return;

    const userMsg = { 
      id: uuidv4(),
      role: 'user' as const, 
      content: messageText
    };
    setMessages(prev => [...prev, userMsg]);
    saveMessage(userMsg);
    setInput('');
    setIsGenerating(true);
    setAgentSteps([]);
    setActiveStep("Planning research strategy...");

    try {
      // Step 1: Agent Planning
      const plan = await getAgentPlan(messageText, messages, documents);
      setAgentSteps(plan.steps);
      
      let aggregatedMatches: any[] = [];

      // Step 2: Multi-query Search
      for (const query of plan.searchQueries) {
        setActiveStep(`Searching for: ${query}`);
        const queryEmbedding = await getEmbedding(query, true);
        const searchRes = await fetch(`/api/workspaces/${project.id}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryEmbedding, topK: 5 })
        });
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          aggregatedMatches = [...aggregatedMatches, ...searchData.matches];
        }
      }

      // Step 3: Web Scrape if needed
      if (plan.needsWebScrape && plan.needsWebScrape !== "null") {
        setActiveStep(`Crawling external source: ${plan.needsWebScrape}`);
        const scrapeRes = await fetch(`/api/scrape?url=${encodeURIComponent(plan.needsWebScrape)}`);
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          aggregatedMatches.push({
            metadata: { 
              title: `Web: ${plan.needsWebScrape}`, 
              text: scrapeData.text 
            },
            score: 1.0
          });
        }
      }

      // Step 3.5: Re-ranking
      setActiveStep("Refining search results...");
      const rerankedMatches = await rerankResults(messageText, aggregatedMatches);
      
      const aggregatedContext = rerankedMatches.map(m => `\n[Source: ${m.metadata.title}]:\n${m.metadata.text}\n`).join('\n');
      const allSources = rerankedMatches.map(m => ({
        title: m.metadata.title,
        score: Math.round((m.score || 1.0) * 100),
        pageNumber: m.metadata.pageNumber
      }));

      // Step 4: Synthesize Final Answer
      setActiveStep("Synthesizing findings...");
      const answer = await synthesizeAnswer(messageText, aggregatedContext, messages);

      const uniqueSources = Array.from(new Map(allSources.map(s => [s.title, s])).values());

      const assistantMsg = { 
        id: uuidv4(),
        role: 'assistant' as const, 
        content: answer, 
        sources: uniqueSources 
      };
      setMessages(prev => [...prev, assistantMsg]);
      saveMessage(assistantMsg);
    } catch (err) {
      console.error("Chat failed:", err);
      const errorMsg = { 
        id: uuidv4(),
        role: 'assistant' as const, 
        content: "I encountered an error during my research process. Please try again." 
      };
      setMessages(prev => [...prev, errorMsg]);
      saveMessage(errorMsg);
    } finally {
      setIsGenerating(false);
      setActiveStep(null);
    }
  };

  return (
    <div className="flex h-screen bg-bg text-text-main overflow-hidden font-sans transition-colors duration-300">
      {/* Left Sidebar: Sources */}
      <aside className="w-80 border-r border-border-muted bg-surface/30 flex flex-col">
        <div className="p-6 border-b border-border-muted">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Projects</span>
          </button>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-display font-black truncate tracking-tighter text-text-main">{project.name}</h2>
            <button 
              onClick={() => handleIndexAll()}
              className="p-1.5 text-text-dim hover:text-accent hover:bg-surface-2 rounded-lg transition-all"
              title="Index all sources"
            >
              <Sparkles size={16} />
            </button>
          </div>
          <p className="text-[10px] text-text-dim font-mono font-bold uppercase tracking-[0.2em]">Sources ({documents.length})</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {sourceType && (
              <motion.div 
                key="source-form-sidebar"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-surface border border-accent/30 rounded-2xl p-4 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center",
                      sourceType === 'url' ? "bg-blue-500/10 text-blue-400" : 
                      sourceType === 'note' ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                    )}>
                      {sourceType === 'url' ? <Globe size={14} /> : 
                       sourceType === 'note' ? <StickyNote size={14} /> : <Type size={14} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">New {sourceType}</span>
                  </div>
                  <button onClick={() => setSourceType(null)} className="text-text-dim hover:text-text-main">
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-4">
                  {(sourceType === 'text' || sourceType === 'note') && (
                    <input 
                      type="text" 
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="Title..."
                      className="w-full px-3 py-2 bg-surface-2 border border-border-muted rounded-xl text-sm focus:outline-none focus:border-accent text-text-main"
                    />
                  )}
                  
                  {sourceType === 'url' ? (
                    <div className="space-y-3">
                      <input 
                        type="url" 
                        value={sourceInput}
                        onChange={(e) => setSourceInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-surface-2 border border-border-muted rounded-xl text-sm focus:outline-none focus:border-accent text-text-main"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={shouldCrawl}
                          onChange={(e) => setShouldCrawl(e.target.checked)}
                          className="w-4 h-4 rounded border-border-muted bg-surface-2 text-accent focus:ring-accent"
                        />
                        <span className="text-[0.7rem] font-bold text-text-dim">Crawl entire site</span>
                      </label>
                    </div>
                  ) : (
                    <textarea 
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      placeholder={sourceType === 'note' ? "Write your note..." : "Paste text..."}
                      className="w-full px-3 py-2 bg-surface-2 border border-border-muted rounded-xl text-sm focus:outline-none focus:border-accent h-32 resize-none text-text-main"
                    />
                  )}

                  <button 
                    onClick={handleIndexSource}
                    disabled={isUploading || !sourceInput.trim()}
                    className="w-full py-3 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Index Source</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {documents.map(doc => (
            <div 
              key={doc.id}
              onClick={() => setActiveSource(doc)}
              className={cn(
                "p-4 rounded-2xl cursor-pointer transition-all border",
                activeSource?.id === doc.id 
                  ? "bg-surface-2 border-accent shadow-lg shadow-accent/5" 
                  : "bg-surface/50 border-transparent hover:bg-surface-2 hover:border-border-muted"
              )}
            >
              <div className="flex items-start gap-3">
                <div 
                  key="doc-icon"
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    doc.type === 'pdf' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                  )}
                >
                  {doc.type === 'pdf' ? <FileText size={16} /> : <Globe size={16} />}
                </div>
                <div key="doc-info" className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate text-text-main group-hover:text-accent transition-colors">{doc.title}</p>
                    {doc.status === 'indexing' && <Loader2 size={12} className="animate-spin text-accent" />}
                    {doc.status === 'ready' && <CheckCircle2 size={12} className="text-green-500" />}
                    {doc.status === 'error' && <AlertCircle size={12} className="text-red-500" />}
                  </div>
                  <p className="text-[0.65rem] text-text-dim font-mono font-bold uppercase tracking-widest">
                    {doc.type} • {doc.status || 'ready'}
                  </p>
                </div>
                {activeSource?.id === doc.id && (
                  <div key="doc-actions" className="flex gap-1">
                    <button 
                      key="reindex-btn"
                      onClick={(e) => { e.stopPropagation(); handleReindex(doc.id); }}
                      className="p-1.5 bg-surface text-accent rounded-lg hover:bg-surface-3 transition-all"
                      title="Re-index source"
                    >
                      {isIndexingSource === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                    <button 
                      key="delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                      className="p-1.5 bg-surface text-red-500 rounded-lg hover:bg-red-500/10 transition-all"
                      title="Delete source"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {documents.length === 0 && !isUploading && (
            <div key="no-sources-empty" className="py-12 text-center">
              <BookOpen size={32} className="mx-auto text-text-dim/20 mb-4" />
              <p className="text-sm text-text-dim font-bold uppercase tracking-widest">No sources yet</p>
            </div>
          )}

          {isUploading && (
            <div key="indexing-loader-sidebar" className="p-4 bg-surface-2 border border-border-muted rounded-2xl animate-pulse flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-accent" />
              <span className="text-sm font-bold text-text-dim uppercase tracking-widest">Indexing...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-muted relative bg-surface/50">
          <AnimatePresence>
            {isAddSourceMenuOpen && (
              <motion.div 
                key="add-source-menu"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-4 right-4 mb-4 bg-surface border border-border-muted rounded-[24px] shadow-2xl overflow-hidden z-30 p-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { fileInputRef.current?.click(); setIsAddSourceMenuOpen(false); }}
                    className="p-4 flex flex-col items-center gap-2 hover:bg-surface-2 rounded-2xl transition-all text-center group"
                  >
                    <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FilePlus size={20} />
                    </div>
                    <span className="text-xs font-bold text-text-main">PDF</span>
                  </button>
                  <button 
                    onClick={() => { setSourceType('url'); setIsAddSourceMenuOpen(false); }}
                    className="p-4 flex flex-col items-center gap-2 hover:bg-surface-2 rounded-2xl transition-all text-center group"
                  >
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Globe size={20} />
                    </div>
                    <span className="text-xs font-bold text-text-main">Website</span>
                  </button>
                  <button 
                    onClick={() => { setSourceType('text'); setIsAddSourceMenuOpen(false); }}
                    className="p-4 flex flex-col items-center gap-2 hover:bg-surface-2 rounded-2xl transition-all text-center group"
                  >
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Type size={20} />
                    </div>
                    <span className="text-xs font-bold text-text-main">Text</span>
                  </button>
                  <button 
                    onClick={() => { setSourceType('note'); setIsAddSourceMenuOpen(false); }}
                    className="p-4 flex flex-col items-center gap-2 hover:bg-surface-2 rounded-2xl transition-all text-center group"
                  >
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <StickyNote size={20} />
                    </div>
                    <span className="text-xs font-bold text-text-main">Note</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsAddSourceMenuOpen(!isAddSourceMenuOpen)}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
              isAddSourceMenuOpen 
                ? "bg-accent text-white shadow-accent/20" 
                : "bg-surface-2 border border-border-muted text-text-main hover:border-accent shadow-black/5"
            )}
          >
            <Plus size={20} className={cn("transition-transform duration-300", isAddSourceMenuOpen && "rotate-45")} />
            <span>{isAddSourceMenuOpen ? 'Close' : 'Add Source'}</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.txt"
          />
        </div>
      </aside>

      {/* Main Content: Chat & Source Viewer */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-border-muted bg-surface/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-text-dim text-sm font-bold uppercase tracking-widest">
              <MessageSquare size={16} />
              <span>Chat</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSendMessage(undefined)}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white rounded-full text-xs font-bold hover:bg-accent-dark transition-all shadow-lg shadow-accent/10"
            >
              <Sparkles size={14} />
              <span>Noteflow Guide</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 custom-scrollbar">
          {messages.length === 0 && (
            <div key="welcome-screen-empty" className="h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-12">
              <div className="w-20 h-20 bg-surface rounded-[32px] flex items-center justify-center text-accent mb-8 shadow-2xl border border-border-muted">
                <Sparkles size={40} />
              </div>
              <h1 className="text-5xl font-display font-black mb-4 text-text-main tracking-tighter">Noteflow <span className="text-accent underline decoration-4 underline-offset-8">Research</span></h1>
              <p className="text-text-muted text-lg mb-12 max-w-2xl font-medium">
                Select a research template to jumpstart your analysis, or ask a custom question to begin your synthesis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {MISSION_TEMPLATES.map(template => (
                  <button 
                    key={template.id}
                    onClick={() => { setInput(template.prompt); }}
                    className="group p-6 bg-surface/40 border border-border-muted rounded-[32px] text-left hover:border-accent hover:bg-surface/60 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300 shrink-0 shadow-lg shadow-accent/5">
                        {template.icon}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-text-main mb-1 group-hover:text-accent transition-colors">{template.title}</h3>
                        <p className="text-[0.65rem] text-text-dim leading-relaxed font-mono font-bold uppercase tracking-widest">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 flex items-center gap-4 w-full">
                <div className="h-[1px] flex-1 bg-border-muted" />
                <span className="text-[0.65rem] font-mono font-bold text-text-dim uppercase tracking-[0.3em]">Direct Synthesis</span>
                <div className="h-[1px] flex-1 bg-border-muted" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mt-6">
                {['Summarize sources', 'Key themes', 'Data points', 'Compare docs'].map(q => (
                  <button 
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="px-4 py-3 bg-surface-2 border border-border-muted rounded-xl text-[0.7rem] font-bold text-text-dim hover:bg-surface-3 hover:border-accent hover:text-accent transition-all uppercase tracking-widest"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col gap-4 max-w-3xl",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div 
                key="msg-bubble"
                className={cn(
                   "px-6 py-4 rounded-[28px] shadow-xl border",
                   msg.role === 'user' 
                     ? "bg-accent text-white border-transparent rounded-tr-none font-medium text-[1rem]" 
                     : "bg-surface text-text-main border-border-muted rounded-tl-none"
                )}
              >
                {msg.role === 'assistant' ? (
                  <div key="markdown-content" className="prose prose-sm max-w-none prose-invert prose-serif">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div key="msg-sources" className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2 text-[0.6rem] font-mono font-bold text-text-dim uppercase tracking-[0.2em]">
                    <div className="h-[1px] w-4 bg-border-muted" />
                    Citations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(msg.sources.map(s => `${s.title}|${s.pageNumber || ''}`))).map((uniqueKey, idx) => {
                      const [title, pageNumber] = uniqueKey.split('|');
                      return (
                        <button 
                          key={`source-${idx}`} 
                          onClick={() => {
                            const doc = documents.find(d => d.title === title);
                            if (doc) setActiveSource(doc);
                          }}
                          className="group flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-muted rounded-lg text-[0.7rem] font-mono font-bold text-text-dim hover:border-accent hover:text-accent transition-all shadow-lg"
                        >
                          <div className="w-4 h-4 bg-surface-2 rounded flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                            <FileText size={10} />
                          </div>
                          <span className="truncate max-w-[150px] uppercase tracking-widest">{title}</span>
                          {pageNumber && (
                            <span className="text-accent font-bold">P{pageNumber}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          
          {isGenerating && (
            <div key="generating-loader" className="flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 text-accent font-bold text-sm">
                <div className="relative">
                  <Sparkles size={18} className="animate-pulse" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-1 border border-accent/30 rounded-full border-t-accent"
                  />
                </div>
                <span className="uppercase tracking-[0.2em]">{activeStep || "Noteflow is researching..."}</span>
              </div>
              
              {agentSteps.length > 0 && (
                <div className="flex flex-col gap-2 pl-7 border-l-2 border-accent/20">
                  {agentSteps.map((step, idx) => {
                    const isActive = activeStep && (step.includes(activeStep) || activeStep.includes(step.substring(0, 10)));
                    const isCompleted = !isActive && agentSteps.indexOf(step) < agentSteps.indexOf(activeStep || "");
                    
                    return (
                      <div key={`step-${idx}`} className={cn(
                        "text-[0.65rem] font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                        isActive ? "text-accent translate-x-1" : "text-text-dim opacity-50"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isActive ? "bg-accent animate-pulse" : "bg-text-dim"
                        )} />
                        {step}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div key="messages-end-anchor" ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 lg:p-12 pt-0">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative group"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your sources..."
              className="w-full pl-6 pr-16 py-5 bg-surface border border-border-muted rounded-[24px] shadow-xl shadow-black/5 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-lg text-text-main"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-surface-2 text-text-main rounded-2xl flex items-center justify-center hover:bg-surface-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg border border-border-muted"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-center text-[0.6rem] text-text-dim font-mono font-bold uppercase tracking-[0.2em] mt-4">
            Powered by Swahivo <span className="text-accent/50 text-[0.5rem] px-1 bg-surface-2 rounded ml-1">v4.2</span>
          </p>
        </div>

        {/* Source Viewer Modal */}
        <AnimatePresence>
          {activeSource && (
            <motion.div 
              key="source-viewer"
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="absolute right-0 top-0 bottom-0 w-[500px] bg-surface border-l border-border-muted shadow-2xl z-20 flex flex-col"
            >
              <div className="p-6 border-b border-border-muted flex items-center justify-between bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-accent shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm truncate max-w-[300px] text-text-main">{activeSource.title}</h3>
                    <p className="text-[0.6rem] text-text-dim font-mono font-black uppercase tracking-widest">{activeSource.type} &bull; v1.0</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSource(null)}
                  className="p-2 hover:bg-surface-3 rounded-full transition-all text-text-main"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="prose prose-sm max-w-none prose-stone dark:prose-invert">
                  <h4 className="text-lg font-serif font-bold mb-4 text-text-main">Extracted Content</h4>
                  <p className="whitespace-pre-wrap text-text-muted leading-relaxed">
                    {activeSource.content}...
                  </p>
                  <div className="mt-8 p-6 bg-surface-2 rounded-2xl border border-border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-text-dim font-bold uppercase tracking-widest">Noteflow Insight</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSummarizeSource}
                          disabled={isSummarizing}
                          className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border-muted rounded-full text-[0.65rem] font-bold text-accent hover:border-accent transition-all disabled:opacity-50"
                        >
                          {isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          <span>{activeSource.summary ? 'Update Summary' : 'Summarize'}</span>
                        </button>
                        <button 
                          onClick={() => handleReindex(activeSource.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border-muted rounded-full text-[0.65rem] font-bold text-accent hover:border-accent transition-all"
                        >
                          {isIndexingSource === activeSource.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          <span>Re-index</span>
                        </button>
                      </div>
                    </div>
                    {activeSource.summary ? (
                      <div className="prose prose-sm max-w-none prose-stone dark:prose-invert">
                        <Markdown>{activeSource.summary}</Markdown>
                      </div>
                    ) : (
                      <p className="text-sm italic text-text-dim">
                        Full document analysis is available via chat. Click "Summarize" to get a quick overview of this source.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
