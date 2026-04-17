import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search,
  FileText, 
  Globe, 
  Send, 
  Loader2, 
  Sparkles,
  X,
  CheckCircle2,
  BookOpen,
  Library,
  Filter,
  Info
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project, WorkspaceDocument, User } from '../../types';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';
import { getEmbedding } from '../../services/geminiService';

interface AskReferencesProps {
  user: User;
  project: Project;
  onBack: () => void;
}

export function AskReferences({ user, project, onBack }: AskReferencesProps) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string, sources?: any[] }[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/workspaces/${project.id}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg = { 
      id: uuidv4(),
      role: 'user' as const, 
      content: input 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const queryEmbedding = await getEmbedding(userMsg.content, true);
      const res = await fetch(`/api/workspaces/${project.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content, 
          userId: user.id,
          queryEmbedding,
          docIds: selectedDocIds,
          history: messages.slice(-6) // Send last 6 messages for context
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg = { 
        id: uuidv4(),
        role: 'assistant' as const, 
        content: data.answer, 
        sources: data.sources 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat failed:", err);
      const errorMsg = { 
        id: uuidv4(),
        role: 'assistant' as const, 
        content: "Sorry, I encountered an error processing your request." 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#faf9f7] text-[#1a1a1a] overflow-hidden">
      {/* Left Sidebar: Source Selection */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-[#e8e5e0] bg-white flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-[#e8e5e0]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold flex items-center gap-2">
                  <Library size={20} className="text-[#9a7a52]" />
                  References
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-[#f2f0ec] rounded-lg text-[#aaa] transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" size={14} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sources..."
                  className="w-full pl-9 pr-4 py-2 bg-[#f2f0ec] border-none rounded-xl text-sm focus:ring-1 focus:ring-[#9a7a52] transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-bold text-[#aaa] uppercase tracking-widest">
                  {selectedDocIds.length} Selected
                </p>
                <button 
                  onClick={() => setSelectedDocIds([])}
                  className="text-[0.65rem] font-bold text-[#9a7a52] uppercase tracking-widest hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredDocs.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => toggleDocSelection(doc.id)}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3",
                    selectedDocIds.includes(doc.id) 
                      ? "bg-[#9a7a52]/5 border-[#9a7a52]" 
                      : "bg-white border-transparent hover:bg-[#f9f8f6]"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    selectedDocIds.includes(doc.id) 
                      ? "bg-[#9a7a52] border-[#9a7a52] text-white" 
                      : "border-[#e8e5e0] bg-white"
                  )}>
                    {selectedDocIds.includes(doc.id) && <CheckCircle2 size={12} />}
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    doc.type === 'pdf' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                  )}>
                    {doc.type === 'pdf' ? <FileText size={16} /> : <Globe size={16} />}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-bold truncate">{doc.title}</p>
                    <p className="text-[0.6rem] text-[#aaa] font-medium uppercase tracking-wider">{doc.type}</p>
                  </div>
                </div>
              ))}

              {filteredDocs.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-xs text-[#aaa]">No sources found</p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-[#e8e5e0] bg-white flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-[#f2f0ec] rounded-lg text-[#9a7a52] transition-all"
              >
                <Library size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-[#9a7a52]" />
              <h2 className="font-serif font-bold">Ask References</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedDocIds.length > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[0.7rem] font-bold border border-emerald-100">
                <Filter size={12} />
                <span>Filtering by {selectedDocIds.length} sources</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[0.7rem] font-bold border border-amber-100">
                <Info size={12} />
                <span>Searching all sources</span>
              </div>
            )}
            <button 
              onClick={onBack}
              className="p-2 hover:bg-[#f2f0ec] rounded-full text-[#aaa] transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="w-16 h-16 bg-[#f2f0ec] rounded-2xl flex items-center justify-center text-[#9a7a52] mb-6">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-serif font-medium mb-3">Ask your references</h3>
              <p className="text-[#666] text-sm mb-8">
                Select specific documents from the sidebar to narrow down your research. 
                I will only use information from the selected sources to answer your questions.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['What are the main conclusions?', 'Summarize the methodology', 'List all key stakeholders', 'Compare the findings'].map(q => (
                  <button 
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-4 py-2 bg-white border border-[#e8e5e0] rounded-full text-xs font-bold text-[#666] hover:border-[#9a7a52] hover:text-[#9a7a52] transition-all"
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
                "flex flex-col gap-3 max-w-3xl",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-5 py-3 rounded-2xl text-[0.95rem] leading-relaxed shadow-sm border",
                msg.role === 'user' 
                  ? "bg-[#2e2e2e] text-white border-transparent rounded-tr-none" 
                  : "bg-white text-[#1a1a1a] border-[#e8e5e0] rounded-tl-none"
              )}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-stone">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2 text-[0.55rem] font-bold text-[#aaa] uppercase tracking-[0.15em]">
                    <div className="h-[1px] w-3 bg-[#e8e5e0]" />
                    Citations
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(msg.sources.map(s => `${s.title}|${s.pageNumber || ''}`))).map((uniqueKey, idx) => {
                      const [title, pageNumber] = uniqueKey.split('|');
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#e8e5e0] rounded text-[0.65rem] font-medium text-[#1a1a1a] shadow-sm"
                        >
                          <FileText size={10} className="text-[#9a7a52]" />
                          <span className="truncate max-w-[120px]">{title}</span>
                          {pageNumber && (
                            <span className="text-[#9a7a52] font-bold">P{pageNumber}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          
          {isGenerating && (
            <div className="flex items-center gap-3 text-[#9a7a52] font-bold text-xs animate-pulse">
              <Sparkles size={16} className="animate-spin" />
              <span>Analyzing selected references...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8 pt-0">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedDocIds.length > 0 ? `Ask about ${selectedDocIds.length} selected sources...` : "Ask about all sources..."}
              className="w-full pl-6 pr-14 py-4 bg-white border border-[#e8e5e0] rounded-2xl shadow-xl shadow-black/5 focus:outline-none focus:border-[#9a7a52] transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#2e2e2e] text-white rounded-xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-30 shadow-lg"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
