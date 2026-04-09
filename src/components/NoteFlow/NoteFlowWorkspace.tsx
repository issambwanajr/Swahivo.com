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
  Trash2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Workspace, WorkspaceDocument, User } from '../../types';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';
import { getEmbedding } from '../../services/geminiService';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface NoteFlowWorkspaceProps {
  user: User;
  workspace: Workspace;
  onBack: () => void;
}

export function NoteFlowWorkspace({ user, workspace, onBack }: NoteFlowWorkspaceProps) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string, sources?: any[] }[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSource, setActiveSource] = useState<WorkspaceDocument | null>(null);
  const [isAddSourceMenuOpen, setIsAddSourceMenuOpen] = useState(false);
  const [isIndexingSource, setIsIndexingSource] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'pdf' | 'url' | 'text' | 'note' | null>(null);
  const [sourceInput, setSourceInput] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [workspace.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const vectors = await Promise.all(chunks.map(async (chunk, i) => {
        const embedding = await getEmbedding(chunk, false);
        return {
          id: `${uuidv4()}-c${i}`,
          values: embedding,
          metadata: {
            text: chunk,
            workspace_id: workspace.id,
            user_id: user.id,
            title: file.name,
            type: 'pdf',
            pageNumber: Math.floor(i / 2) + 1
          }
        };
      }));

      const res = await fetch(`/api/workspaces/${workspace.id}/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          vectors, 
          content: fullText.substring(0, 1000),
          title: file.name
        })
      });
      const newDoc = await res.json();
      setDocuments([...documents, newDoc]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleIndexSource = async () => {
    if (!sourceType) return;
    if (sourceType === 'url' && !sourceInput.trim()) return;
    if ((sourceType === 'text' || sourceType === 'note') && !sourceInput.trim()) return;

    setIsUploading(true);
    try {
      const textToIndex = sourceType === 'url' ? `This is a website source from ${sourceInput}. Full content would be scraped here in a production environment.` : sourceInput;
      const chunks = textToIndex.match(/[\s\S]{1,1500}/g) || [];
      const vectors = await Promise.all(chunks.map(async (chunk, i) => {
        const embedding = await getEmbedding(chunk, false);
        return {
          id: `${uuidv4()}-c${i}`,
          values: embedding,
          metadata: {
            text: chunk,
            workspace_id: workspace.id,
            user_id: user.id,
            title: sourceTitle || (sourceType === 'note' ? 'My Note' : sourceInput.substring(0, 30)),
            type: sourceType
          }
        };
      }));

      const endpoint = sourceType === 'note' ? `/api/workspaces/${workspace.id}/notes` : `/api/workspaces/${workspace.id}/documents/index`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: sourceType, 
          content: sourceInput, 
          title: sourceTitle || (sourceType === 'note' ? 'My Note' : sourceInput.substring(0, 30)),
          userId: user.id,
          vectors,
          embedding: sourceType === 'note' ? vectors[0].values : undefined
        })
      });
      const newDoc = await res.json();
      setDocuments([...documents, newDoc]);
      setSourceType(null);
      setSourceInput('');
      setSourceTitle('');
    } catch (err) {
      console.error("Indexing failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReindex = async (docId: string) => {
    setIsIndexingSource(docId);
    try {
      await fetch(`/api/workspaces/${workspace.id}/documents/${docId}/reindex`, {
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
    if (!confirm("Are you sure you want to delete this source? This will remove it from your knowledge base.")) return;
    
    try {
      await fetch(`/api/workspaces/${workspace.id}/documents/${docId}`, {
        method: 'DELETE'
      });
      setDocuments(documents.filter(d => d.id !== docId));
      if (activeSource?.id === docId) setActiveSource(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleIndexAll = async () => {
    // In a real app, this would trigger a workspace-wide indexing job
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
    
    const messageText = typeof e === 'string' ? e : (input.trim() || "Give me a high-level summary of all my sources and suggest some research questions.");
    if (!messageText && !input.trim()) return;

    const userMsg = { 
      id: uuidv4(),
      role: 'user' as const, 
      content: typeof e === 'string' ? e : (input || "Notebook Guide Request") 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const queryEmbedding = await getEmbedding(messageText, true);
      const res = await fetch(`/api/workspaces/${workspace.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText, 
          userId: user.id,
          queryEmbedding
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        id: uuidv4(),
        role: 'assistant', 
        content: data.answer, 
        sources: data.sources 
      }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { 
        id: uuidv4(),
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#faf9f7] text-[#1a1a1a] overflow-hidden">
      {/* Left Sidebar: Sources */}
      <aside className="w-80 border-r border-[#e8e5e0] bg-[#f2f0ec] flex flex-col">
        <div className="p-6 border-b border-[#e8e5e0]">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#666] hover:text-black transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">All Projects</span>
          </button>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-serif font-bold truncate">{workspace.name}</h2>
            <button 
              onClick={() => handleIndexAll()}
              className="p-1.5 text-[#aaa] hover:text-[#9a7a52] hover:bg-white rounded-lg transition-all"
              title="Index all sources"
            >
              <Sparkles size={16} />
            </button>
          </div>
          <p className="text-xs text-[#888] font-medium uppercase tracking-widest">Sources ({documents.length})</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {documents.map(doc => (
            <div 
              key={doc.id}
              onClick={() => setActiveSource(doc)}
              className={cn(
                "p-4 rounded-2xl cursor-pointer transition-all border",
                activeSource?.id === doc.id 
                  ? "bg-white border-[#9a7a52] shadow-md" 
                  : "bg-white/50 border-transparent hover:bg-white hover:border-[#e8e5e0]"
              )}
            >
              <div className="flex items-start gap-3">
                <div 
                  key="doc-icon"
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    doc.type === 'pdf' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                  )}
                >
                  {doc.type === 'pdf' ? <FileText size={16} /> : <Globe size={16} />}
                </div>
                <div key="doc-info" className="overflow-hidden flex-1">
                  <p className="text-sm font-bold truncate">{doc.title}</p>
                  <p className="text-[0.7rem] text-[#aaa] font-medium uppercase tracking-wider">{doc.type}</p>
                </div>
                {activeSource?.id === doc.id && (
                  <div key="doc-actions" className="flex gap-1">
                    <button 
                      key="reindex-btn"
                      onClick={(e) => { e.stopPropagation(); handleReindex(doc.id); }}
                      className="p-1.5 bg-[#f2f0ec] text-[#9a7a52] rounded-lg hover:bg-[#e8e5e0] transition-all"
                      title="Re-index source"
                    >
                      {isIndexingSource === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                    <button 
                      key="delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                      className="p-1.5 bg-[#f2f0ec] text-red-500 rounded-lg hover:bg-red-50 transition-all"
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
              <BookOpen size={32} className="mx-auto text-[#ccc] mb-4" />
              <p className="text-sm text-[#999] font-medium">No sources yet</p>
            </div>
          )}

          {isUploading && (
            <div key="indexing-loader-sidebar" className="p-4 bg-white border border-[#e8e5e0] rounded-2xl animate-pulse flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-[#9a7a52]" />
              <span className="text-sm font-medium text-[#666]">Indexing...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#e8e5e0] relative">
          <AnimatePresence>
            {isAddSourceMenuOpen && (
              <motion.div 
                key="add-source-menu"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-[#e8e5e0] rounded-2xl shadow-2xl overflow-hidden z-30"
              >
                <button 
                  onClick={() => { fileInputRef.current?.click(); setIsAddSourceMenuOpen(false); }}
                  className="w-full p-4 flex items-center gap-3 hover:bg-[#f2f0ec] transition-all text-left"
                >
                  <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Upload PDF</p>
                    <p className="text-[0.65rem] text-[#aaa] font-medium uppercase">Local files</p>
                  </div>
                </button>
                <button 
                  onClick={() => { setSourceType('url'); setIsAddSourceMenuOpen(false); }}
                  className="w-full p-4 flex items-center gap-3 hover:bg-[#f2f0ec] transition-all text-left border-t border-[#f2f0ec]"
                >
                  <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Add Website</p>
                    <p className="text-[0.65rem] text-[#aaa] font-medium uppercase">URL Link</p>
                  </div>
                </button>
                <button 
                  onClick={() => { setSourceType('text'); setIsAddSourceMenuOpen(false); }}
                  className="w-full p-4 flex items-center gap-3 hover:bg-[#f2f0ec] transition-all text-left border-t border-[#f2f0ec]"
                >
                  <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                    <Type size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Paste Text</p>
                    <p className="text-[0.65rem] text-[#aaa] font-medium uppercase">Manual entry</p>
                  </div>
                </button>
                <button 
                  onClick={() => { setSourceType('note'); setIsAddSourceMenuOpen(false); }}
                  className="w-full p-4 flex items-center gap-3 hover:bg-[#f2f0ec] transition-all text-left border-t border-[#f2f0ec]"
                >
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Add Note</p>
                    <p className="text-[0.65rem] text-[#aaa] font-medium uppercase">Your thoughts</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsAddSourceMenuOpen(!isAddSourceMenuOpen)}
            className="w-full py-4 bg-white border border-[#e8e5e0] text-[#1a1a1a] rounded-2xl font-bold hover:border-[#9a7a52] hover:shadow-lg hover:shadow-black/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} className={cn("transition-transform", isAddSourceMenuOpen && "rotate-45")} />
            <span>Add Source</span>
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

      {/* Indexing Modal */}
      <AnimatePresence>
        {sourceType && (
          <div key="indexing-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl border border-[#e8e5e0]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    sourceType === 'url' ? "bg-blue-50 text-blue-500" : 
                    sourceType === 'note' ? "bg-emerald-50 text-emerald-500" : "bg-purple-50 text-purple-500"
                  )}>
                    {sourceType === 'url' ? <Globe size={24} /> : 
                     sourceType === 'note' ? <MessageSquare size={24} /> : <Type size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold">Index {sourceType === 'url' ? 'Website' : sourceType === 'note' ? 'Note' : 'Text'}</h2>
                    <p className="text-sm text-[#888]">Add this to your project's knowledge base.</p>
                  </div>
                </div>
                <button onClick={() => setSourceType(null)} className="p-2 hover:bg-[#f2f0ec] rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {sourceType === 'text' && (
                  <div>
                    <label className="block text-xs font-bold text-[#666] mb-2 uppercase tracking-widest">Source Title</label>
                    <input 
                      type="text" 
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="e.g. Research Notes"
                      className="w-full px-4 py-3 bg-[#f9f8f6] border border-[#e8e5e0] rounded-xl focus:outline-none focus:border-[#9a7a52] transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[#666] mb-2 uppercase tracking-widest">
                    {sourceType === 'url' ? 'Website URL' : 'Content'}
                  </label>
                  {sourceType === 'url' ? (
                    <input 
                      type="url" 
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full px-4 py-3 bg-[#f9f8f6] border border-[#e8e5e0] rounded-xl focus:outline-none focus:border-[#9a7a52] transition-all"
                    />
                  ) : (
                    <textarea 
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      placeholder="Paste your text here..."
                      className="w-full px-4 py-3 bg-[#f9f8f6] border border-[#e8e5e0] rounded-xl focus:outline-none focus:border-[#9a7a52] transition-all h-48 resize-none"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setSourceType(null)}
                    className="flex-1 py-4 bg-[#f2f0ec] text-[#666] rounded-2xl font-bold hover:bg-[#e8e5e0] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleIndexSource}
                    disabled={isUploading || !sourceInput.trim()}
                    className="flex-1 py-4 bg-[#9a7a52] text-white rounded-2xl font-bold hover:bg-[#866944] transition-all shadow-lg shadow-[#9a7a52]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    <span>Index Source</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content: Chat & Source Viewer */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#e8e5e0] bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#999] text-sm font-medium">
              <MessageSquare size={16} />
              <span>Chat</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSendMessage(undefined)} // Trigger a general summary
              className="flex items-center gap-2 px-4 py-1.5 bg-[#9a7a52] text-white rounded-full text-xs font-bold hover:bg-[#866944] transition-all shadow-sm"
            >
              <Sparkles size={14} />
              <span>Notebook Guide</span>
            </button>
            <div className="px-3 py-1 bg-[#f2f0ec] rounded-full text-[0.7rem] font-bold text-[#666] uppercase tracking-wider">
              Noteflow LM Engine
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 custom-scrollbar">
          {messages.length === 0 && (
            <div key="welcome-screen-empty" className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-[#f2f0ec] rounded-[32px] flex items-center justify-center text-[#9a7a52] mb-8">
                <Sparkles size={40} />
              </div>
              <h1 className="text-4xl font-serif font-medium mb-4">How can I help with your research?</h1>
              <p className="text-[#666] text-lg mb-8">
                I'm your Noteflow LM thinking partner. Upload sources to start a deep research session, or ask me anything to get started.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                {['Summarize my sources', 'Find key themes', 'Extract data points', 'Compare documents'].map(q => (
                  <button 
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="p-4 bg-white border border-[#e8e5e0] rounded-2xl text-sm font-bold text-[#666] hover:border-[#9a7a52] hover:text-[#9a7a52] transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
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
                  "px-6 py-4 rounded-[28px] text-[1rem] leading-relaxed shadow-sm border",
                  msg.role === 'user' 
                    ? "bg-[#2e2e2e] text-white border-transparent rounded-tr-none" 
                    : "bg-white text-[#1a1a1a] border-[#e8e5e0] rounded-tl-none"
                )}
              >
                {msg.role === 'assistant' ? (
                  <div key="markdown-content" className="prose prose-sm max-w-none prose-stone">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div key="msg-sources" className="flex flex-wrap gap-2">
                  {msg.sources.map((s, idx) => (
                    <button 
                      key={`source-${s.title}-${idx}`} 
                      onClick={() => {
                        const doc = documents.find(d => d.title === s.title);
                        if (doc) setActiveSource(doc);
                      }}
                      className="px-3 py-1 bg-[#f2f0ec] border border-[#e8e5e0] rounded-full text-[0.65rem] font-bold text-[#9a7a52] uppercase tracking-wider hover:bg-[#9a7a52] hover:text-white transition-all"
                    >
                      {s.title} {s.pageNumber ? `• P${s.pageNumber}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          
          {isGenerating && (
            <div key="generating-loader" className="flex items-center gap-3 text-[#9a7a52] font-bold text-sm animate-pulse">
              <Sparkles size={18} className="animate-spin" />
              <span>Noteflow LM is synthesizing...</span>
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
              className="w-full pl-6 pr-16 py-5 bg-white border border-[#e8e5e0] rounded-[24px] shadow-xl shadow-black/5 focus:outline-none focus:ring-2 focus:ring-[#9a7a52]/20 focus:border-[#9a7a52] transition-all text-lg"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#2e2e2e] text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-center text-[0.65rem] text-[#aaa] font-medium uppercase tracking-widest mt-4">
            Powered by Noteflow LM & Gemini Embedding 2
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
              className="absolute right-0 top-0 bottom-0 w-[500px] bg-white border-l border-[#e8e5e0] shadow-2xl z-20 flex flex-col"
            >
              <div className="p-6 border-b border-[#e8e5e0] flex items-center justify-between bg-[#f2f0ec]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#9a7a52] shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm truncate max-w-[300px]">{activeSource.title}</h3>
                    <p className="text-[0.6rem] text-[#aaa] font-bold uppercase tracking-wider">{activeSource.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSource(null)}
                  className="p-2 hover:bg-white rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="prose prose-sm max-w-none prose-stone">
                  <h4 className="text-lg font-serif font-bold mb-4">Extracted Content</h4>
                  <p className="whitespace-pre-wrap text-[#444] leading-relaxed">
                    {activeSource.content}...
                  </p>
                  <div className="mt-8 p-6 bg-[#f2f0ec] rounded-2xl border border-[#e8e5e0]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#888] font-bold uppercase tracking-widest">Note Flow Insight</p>
                      <button 
                        onClick={() => handleReindex(activeSource.id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e8e5e0] rounded-full text-[0.65rem] font-bold text-[#9a7a52] hover:border-[#9a7a52] transition-all"
                      >
                        {isIndexingSource === activeSource.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span>Index Now</span>
                      </button>
                    </div>
                    <p className="text-sm italic text-[#666]">
                      Full document analysis is available via chat. Ask specific questions about this source to extract more details.
                    </p>
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
