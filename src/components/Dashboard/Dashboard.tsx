import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Note } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  FileText, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  BarChart3, 
  MessageSquarePlus, 
  Search, 
  ShoppingBag,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Mic,
  AudioLines,
  Settings,
  Gift,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  ArrowUp,
  X,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';
import Markdown from 'react-markdown';
import { NoteFlowDashboard } from '../NoteFlow/NoteFlowDashboard';
import { NoteFlowWorkspace } from '../NoteFlow/NoteFlowWorkspace';
import { Workspace } from '../../types';

interface DashboardProps {
  user: User;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export function Dashboard({ user, theme, onThemeToggle }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'overview' | 'notes' | 'profile' | 'analytics' | 'marketplace'>('chat');
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, file?: string }[]>([]);
  const [activeModal, setActiveModal] = useState<'link' | 'text' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [textBlockInput, setTextBlockInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [noteFlowMode, setNoteFlowMode] = useState<'dashboard' | 'workspace' | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchNotes = async () => {
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  const firstName = user.name.split(' ')[0];

  const fileToGenerativePart = async (file: File) => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: base64,
        mimeType: file.type,
      },
    };
  };

  const sendMessage = async (customContent?: string, customFile?: File) => {
    const content = customContent || input;
    const file = customFile || selectedFile;

    if (!content.trim() && !file) return;

    const userMessage = {
      role: 'user' as const,
      content: content,
      file: file?.name
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFile(null);
    setIsGenerating(true);

    try {
      // If it's a PDF, we index it first
      if (file && file.type === 'application/pdf') {
        setMessages(prev => [...prev, { role: 'assistant', content: `Indexing ${file.name}...` }]);
        
        // Simulating PDF text extraction for the demo
        // In a real app, we'd use pdfjs-dist here
        const mockPages = [
          { pageNumber: 1, text: "This is a manual for Note Flow. It explains how to use the multimodal RAG assistant.", imageBase64: "" },
          { pageNumber: 2, text: "To index a PDF, simply upload it. The system will extract text and images for better retrieval.", imageBase64: "" }
        ];

        await fetch('/api/index-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfName: file.name, pages: mockPages })
        });
        
        setMessages(prev => [...prev, { role: 'assistant', content: `✓ ${file.name} indexed successfully. You can now ask questions about it.` }]);
        setIsGenerating(false);
        return;
      }

      // Regular Chat with RAG
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || "I'm sorry, I couldn't generate a response."
      }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : "Sorry, I encountered an error while processing your request."}`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const MenuItem = ({ icon: Icon, label, id }: { icon: any, label: string, id: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsProfileOpen(false);
      }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[0.875rem]",
        activeTab === id ? "bg-white/10 text-text-main font-medium" : "text-text-muted hover:bg-white/5 hover:text-text-main"
      )}
    >
      <Icon size={16} className={cn(activeTab === id ? "text-accent-light" : "text-text-dim")} />
      <span>{label}</span>
    </button>
  );

  if (noteFlowMode === 'dashboard') {
    return (
      <NoteFlowDashboard 
        user={user} 
        onSelectWorkspace={(ws) => {
          setSelectedWorkspace(ws);
          setNoteFlowMode('workspace');
        }} 
      />
    );
  }

  if (noteFlowMode === 'workspace' && selectedWorkspace) {
    return (
      <NoteFlowWorkspace 
        user={user} 
        workspace={selectedWorkspace} 
        onBack={() => setNoteFlowMode('dashboard')} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-bg text-text-main font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-white/5 bg-bg flex flex-col h-full transition-all duration-300 z-50",
        isSidebarCollapsed ? "w-[52px]" : "w-64"
      )}>
        {/* Top Icons */}
        <div className="flex flex-col items-center py-4 gap-4">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-text-dim hover:text-text-main hover:bg-white/5 rounded-lg transition-all"
          >
            <PanelLeftOpen size={20} className={cn("transition-transform duration-300", !isSidebarCollapsed && "rotate-180")} />
          </button>

          <div className="w-full px-2 space-y-2">
            <button className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main transition-all",
              isSidebarCollapsed && "justify-center"
            )}>
              <MessageSquarePlus size={20} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">New chat</span>}
            </button>
            <button className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main transition-all",
              isSidebarCollapsed && "justify-center"
            )}>
              <Search size={20} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Search chats</span>}
            </button>
            <button 
              onClick={() => setActiveTab('marketplace')}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main transition-all",
                isSidebarCollapsed && "justify-center",
                activeTab === 'marketplace' && "bg-white/10 text-text-main"
              )}
            >
              <ShoppingBag size={20} className={cn(activeTab === 'marketplace' && "text-accent-light")} />
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium">Marketplaces</span>
                  <span className="text-[0.6rem] font-bold px-1.5 py-0.5 bg-accent text-white rounded uppercase tracking-wider">Apps</span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Icons */}
        <div className="flex flex-col items-center py-4 gap-4">
          <button className={cn(
            "w-full flex items-center gap-3 p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main transition-all",
            isSidebarCollapsed && "justify-center"
          )}>
            <Sparkles size={20} className="text-accent" />
            {!isSidebarCollapsed && (
              <div className="text-left">
                <p className="text-xs font-bold text-accent uppercase tracking-wider">Pro Plan</p>
                <p className="text-[0.7rem] text-text-dim">Upgrade for more</p>
              </div>
            )}
          </button>

          <div className="relative w-full px-2">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "w-full flex items-center gap-3 p-1 rounded-lg hover:bg-white/5 transition-all",
                isSidebarCollapsed && "justify-center"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-[0.7rem] text-text-dim truncate">user Plan</p>
                </div>
              )}
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <React.Fragment key="profile-menu-container">
                  <motion.div 
                    key="profile-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsProfileOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    key="profile-dropdown"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={cn(
                      "absolute bottom-full mb-2 z-50 bg-[#171717] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[200px]",
                      isSidebarCollapsed ? "left-0" : "left-0 right-0"
                    )}
                  >
                    <div className="p-3 border-b border-white/5 bg-white/5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-text-dim truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <button 
                        onClick={() => { setActiveTab('overview'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                      >
                        <LayoutDashboard size={16} /> Overview
                      </button>
                      <button 
                        onClick={() => { setActiveTab('notes'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                      >
                        <FileText size={16} /> Noteflow LM
                      </button>
                      <button 
                        onClick={() => { setActiveTab('analytics'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                      >
                        <BarChart3 size={16} /> Analytics
                      </button>
                      <button 
                        onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                      >
                        <UserIcon size={16} /> Profile
                      </button>
                    </div>
                    <div className="p-1 border-t border-white/5">
                      <button 
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
                      >
                        <Settings size={16} /> Settings
                      </button>
                    </div>
                  </motion.div>
                </React.Fragment>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-bg relative overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 sticky top-0 bg-bg/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="text-[0.9rem] font-bold tracking-tight text-text-muted group-hover:text-text-main transition-colors">SWAHIVO</span>
            <ChevronRight size={14} className="text-text-dim rotate-90" />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onThemeToggle}
              className="p-2 text-text-dim hover:text-text-main hover:bg-white/5 rounded-lg transition-all"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="px-3 py-1.5 bg-white/5 border border-white/10 text-text-muted text-[0.75rem] font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-2">
              <Gift size={14} className="text-accent" />
              Free offer
            </button>
            <div className="flex items-center gap-3 text-text-dim">
              <button className="hover:text-text-main transition-colors"><Settings size={20} /></button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center p-6 lg:p-12">
          {activeTab === 'chat' && (
            <div className={cn(
              "w-full max-w-3xl flex-1 flex flex-col items-center gap-8",
              messages.length === 0 ? "justify-center" : "justify-start"
            )}>
              {messages.length === 0 ? (
                <h1 className="text-4xl font-medium text-white tracking-tight mb-4">What are you working on?</h1>
              ) : (
                <div className="w-full flex-1 overflow-y-auto space-y-6 mb-8 pr-4 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={`msg-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col gap-2 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-[0.95rem] leading-relaxed",
                        msg.role === 'user' ? "bg-accent text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-text-main rounded-tl-none"
                      )}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert max-w-none prose-sm">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                        {msg.file && (
                          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-black/20 rounded-lg text-xs border border-white/5">
                            <FileText size={14} className="text-blue-400" />
                            <span className="truncate max-w-[150px]">{msg.file}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div key="messages-end-anchor" ref={messagesEndRef} />
                </div>
              )}
              
                <div className="w-full max-w-2xl relative group">
                  {/* Removed focus glow div that was appearing on type */}
                  
                  {selectedFile && (
                    <div className="absolute -top-12 left-0 flex items-center gap-2 px-3 py-1.5 bg-accent/20 border border-accent/30 rounded-full text-xs text-accent-light animate-in fade-in slide-in-from-bottom-2">
                      <FileText size={14} />
                      <span className="truncate max-w-[150px] font-medium">{selectedFile.name}</span>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  
                  {/* Plus Menu */}
                  <AnimatePresence>
                    {isPlusMenuOpen && (
                      <React.Fragment key="plus-menu-container">
                        <div key="plus-menu-overlay" className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
                        <motion.div
                          key="plus-menu-dropdown"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-4 z-50 bg-[#171717] border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[170px]"
                        >
                          <button 
                            onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                          >
                            <FileText size={16} className="text-blue-400" />
                            <span>Upload PDF</span>
                          </button>
                          <button 
                            onClick={() => { imageInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                          >
                            <ImageIcon size={16} className="text-green-400" />
                            <span>Image upload</span>
                          </button>
                          <button 
                            onClick={() => { setIsRecording(true); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                          >
                            <Mic size={16} className="text-red-400" />
                            <span>Voice input</span>
                          </button>
                          <button 
                            onClick={() => { setActiveModal('link'); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                          >
                            <LinkIcon size={16} className="text-purple-400" />
                            <span>Paste link</span>
                          </button>
                          <button 
                            onClick={() => { setActiveModal('text'); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                          >
                            <Type size={16} className="text-yellow-400" />
                            <span>Add text block</span>
                          </button>
                        </motion.div>
                      </React.Fragment>
                    )}
                  </AnimatePresence>

                  <div className="relative flex items-center bg-surface border border-border-subtle/30 rounded-2xl py-4 pl-12 pr-24 text-text-main shadow-2xl transition-all focus-within:border-transparent focus-within:shadow-none focus-within:ring-0">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <button 
                        onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                        className={cn(
                          "p-1 text-text-dim hover:text-text-main hover:bg-white/5 rounded-lg transition-all",
                          isPlusMenuOpen && "bg-white/10 text-text-main rotate-45"
                        )}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask anything"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-transparent border-none focus:ring-0 text-[1rem] placeholder:text-text-dim"
                    />
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-text-dim">
                      <button 
                        onClick={() => setIsRecording(!isRecording)}
                        className={cn(
                          "transition-all duration-300",
                          isRecording ? "text-red-500 scale-125 animate-pulse" : "hover:text-white"
                        )}
                      >
                        <Mic size={20} />
                      </button>
                      <button className="hover:text-white transition-colors"><AudioLines size={20} /></button>
                      <button 
                        onClick={() => sendMessage()}
                        disabled={!input.trim() && !selectedFile}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          (input.trim() || selectedFile) ? "bg-accent text-white shadow-lg shadow-accent/20 scale-110" : "text-text-dim opacity-50 cursor-not-allowed"
                        )}
                      >
                        <ArrowUp size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Hidden Inputs */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                
                {isGenerating && (
                  <div key="generating-loader" className="flex items-center gap-2 text-text-dim text-sm animate-pulse mt-4">
                    <Sparkles size={16} className="text-accent" />
                    <span>Gemini is thinking...</span>
                  </div>
                )}
            </div>
          )}

          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl space-y-10"
            >
              <header>
                <h1 className="text-3xl font-serif font-semibold mb-2">Welcome back, {firstName}</h1>
                <p className="text-text-muted text-lg">Here's what's happening with your account today.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#2f2f2f] border border-white/5 p-8 rounded-[20px]">
                  <p className="text-text-muted text-sm font-medium mb-1 uppercase tracking-wider">Total Notes</p>
                  <p className="text-4xl font-bold">{notes.length}</p>
                </div>
                <div className="bg-[#2f2f2f] border border-white/5 p-8 rounded-[20px]">
                  <p className="text-text-muted text-sm font-medium mb-1 uppercase tracking-wider">Active Sessions</p>
                  <p className="text-4xl font-bold">1</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#2f2f2f] border border-white/5 p-8 rounded-[20px]">
                  <h3 className="text-xl font-serif font-semibold mb-6">Recent Activity</h3>
                  {notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.slice(0, 3).map(note => (
                        <div key={note.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent-light">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-[0.95rem]">{note.title}</p>
                              <p className="text-xs text-text-dim">{new Date(note.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-text-dim" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-text-dim italic border border-dashed border-white/10 rounded-xl">
                      No recent activity found.
                    </div>
                  )}
                </div>

                <div className="bg-linear-to-br from-accent to-accent-light p-8 rounded-[20px] text-white shadow-xl shadow-accent/20 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-3">Pro Plan</h3>
                    <p className="text-white/80 text-[0.95rem] leading-relaxed">
                      Unlock advanced analytics and unlimited Noteflow LM storage.
                    </p>
                  </div>
                  <button className="w-full py-3.5 bg-white text-accent font-bold rounded-xl hover:bg-white/90 transition-all active:scale-95 shadow-lg">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl space-y-10"
            >
              <header>
                <h1 className="text-3xl font-serif font-semibold mb-2">Note Flow Marketplace</h1>
                <p className="text-text-muted text-lg">Discover and install extensions for your Note Flow assistant.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#2f2f2f] border border-white/5 p-6 rounded-[20px] flex flex-col gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent-light">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">PDF Analyzer Pro</h3>
                    <p className="text-sm text-text-dim">Advanced multimodal RAG for complex PDF documents.</p>
                  </div>
                  <button 
                    onClick={() => setNoteFlowMode('dashboard')}
                    className="mt-auto py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-all"
                  >
                    Open Note Flow
                  </button>
                </div>
                
                <div className="bg-[#2f2f2f] border border-white/5 p-6 rounded-[20px] flex flex-col gap-4">
                  <div className="w-12 h-12 bg-green-400/10 rounded-xl flex items-center justify-center text-green-400">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Web Search</h3>
                    <p className="text-sm text-text-dim">Real-time web search integration for your chats.</p>
                  </div>
                  <button className="mt-auto py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-all">
                    Install
                  </button>
                </div>

                <div className="bg-[#2f2f2f] border border-white/5 p-6 rounded-[20px] flex flex-col gap-4">
                  <div className="w-12 h-12 bg-purple-400/10 rounded-xl flex items-center justify-center text-purple-400">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Creative Writing</h3>
                    <p className="text-sm text-text-dim">Specialized model for storytelling and creative drafting.</p>
                  </div>
                  <button className="mt-auto py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-all">
                    Install
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'notes' && (
            <div className="w-full max-w-5xl">
              <h2 className="text-3xl font-serif font-semibold mb-6">Noteflow LM</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map(note => (
                  <div key={note.id} className="bg-[#2f2f2f] border border-white/5 p-6 rounded-[20px]">
                    <h4 className="font-bold text-lg mb-2">{note.title}</h4>
                    <p className="text-text-muted text-sm line-clamp-3">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-text-dim italic">No notes found.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex justify-center py-3 bg-bg/50 backdrop-blur-sm border-t border-white/5 mt-auto">
          <p className="text-[0.65rem] text-text-dim/60 font-medium text-center">
            Swahivo AI isn’t perfect—always double-check
          </p>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div key="modal-container" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              key="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#171717] border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 text-text-dim hover:text-text-main hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              {activeModal === 'link' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-purple-400/10 rounded-2xl flex items-center justify-center text-purple-400">
                      <LinkIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Paste Link</h3>
                      <p className="text-sm text-text-dim">Analyze content from a URL</p>
                    </div>
                  </div>
                  <input 
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-400/50 transition-all"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (linkInput) {
                        sendMessage(`Analyze this link: ${linkInput}`);
                        setLinkInput('');
                        setActiveModal(null);
                      }
                    }}
                    className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all active:scale-95"
                  >
                    Analyze Link
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-400">
                      <Type size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Add Text Block</h3>
                      <p className="text-sm text-text-dim">Paste a large snippet of text</p>
                    </div>
                  </div>
                  <textarea 
                    value={textBlockInput}
                    onChange={(e) => setTextBlockInput(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-yellow-400/50 transition-all resize-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (textBlockInput) {
                        sendMessage(textBlockInput);
                        setTextBlockInput('');
                        setActiveModal(null);
                      }
                    }}
                    className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-600 transition-all active:scale-95"
                  >
                    Add Text Block
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
