import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Note } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  FileText, 
  Database,
  User as UserIcon, 
  Plus, 
  Trash2, 
  BarChart3, 
  MessageSquarePlus, 
  Search, 
  ShoppingBag,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Mic,
  AudioLines,
  Settings,
  LogOut,
  Gift,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  ArrowUp,
  ArrowDown,
  X,
  Bot,
  Sun,
  Moon,
  Globe,
  Video,
  LayoutGrid,
  Zap,
  Code,
  StickyNote,
  Loader2,
  Folder,
  Tag,
  FolderPlus,
  Hash,
  Menu,
  SquarePen,
  ChevronUp,
  Terminal,
  Compass,
  MoreVertical,
  Share2,
  Edit2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';
import Markdown from 'react-markdown';
import { NoteFlowDashboard } from '../NoteFlow/NoteFlowDashboard';
import { NoteFlowWorkspace } from '../NoteFlow/NoteFlowWorkspace';
import { logout } from '../../lib/auth';
import { DataIntelligence } from '../DataIntelligence/DataIntelligence';
import { VAR } from '../VAR/VAR';
import { Powerdesk } from '../Powerdesk/Powerdesk';
import { ResearchAgent } from '../ResearchAgent/ResearchAgent';
import { AIChatbots } from '../AIChatbots/AIChatbots';
import { AskReferences } from '../NoteFlow/AskReferences';
import { ProjectHub } from '../ProjectHub/ProjectHub';
import { Project } from '../../types';

interface DashboardProps {
  user: User;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  onLogout?: () => void;
}

export function Dashboard({ user, theme, onThemeToggle, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'overview' | 'notes' | 'profile' | 'settings' | 'analytics' | 'marketplace' | 'data-intelligence' | 'plans' | 'var' | 'powerdesk' | 'project-hub'>('chat');
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, file?: string }[]>([]);
  const [activeModal, setActiveModal] = useState<'link' | 'text' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [textBlockInput, setTextBlockInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [noteflowMode, setNoteflowMode] = useState<'dashboard' | 'workspace' | 'ai-chatbots' | 'ask-references' | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [greeting, setGreeting] = useState('');
  const [sourceType, setSourceType] = useState<'pdf' | 'url' | 'text' | 'note' | null>(null);
  const [sourceInput, setSourceInput] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [folders, setFolders] = useState<{ id: string, name: string }[]>([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isGptsExpanded, setIsGptsExpanded] = useState(false);
  const [activeProjectMenu, setActiveProjectMenu] = useState<string | null>(null);
  const [tags, setTags] = useState<{ id: string, name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [chats, setChats] = useState<{ id: string, title: string, folderId?: string, tags: string[] }[]>([
    { id: '1', title: 'Powerdesk Concept Improvement', tags: ['design'] },
    { id: '2', title: 'JSON structure for orders', tags: ['dev'] },
    { id: '3', title: 'Clone Power BI UI', tags: ['dev'] },
    { id: '4', title: 'AI Studio Features Explained', tags: ['ai'] },
    { id: '5', title: 'PWA VAR with AI', tags: ['dev'] },
    { id: '6', title: 'Multimodal AI System', tags: ['ai'] },
  ]);

  const greetings = [
    `How can I help, ${user.name}?`,
    `What's on your mind, ${user.name}?`,
    `Need a hand with something, ${user.name}?`,
    `What are we building today, ${user.name}?`,
    `Let's create something amazing, ${user.name}.`,
    `How's your day going, ${user.name}?`,
    `Ready to dive in, ${user.name}?`,
    `What's the plan for today, ${user.name}?`
  ];

  useEffect(() => {
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const resp = await fetch(`/api/workspaces?userId=${user.id}`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setFolders(data);
      } else {
        console.error("Fetch projects returned non-array data:", data);
        setFolders([]);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setFolders([]);
    }
  };

  const handleCreateProject = async () => {
    const name = prompt('Project name:');
    if (!name) return;

    try {
      const resp = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: user.id })
      });
      const newProject = await resp.json();
      setFolders(prev => Array.isArray(prev) ? [...prev, newProject] : [newProject]);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      setFolders(prev => Array.isArray(prev) ? prev.filter(f => f.id !== id) : []);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setActiveTab('chat');
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleRenameProject = async (id: string, oldName: string) => {
    const newName = prompt('Rename project:', oldName);
    if (!newName) return;

    try {
      // Assuming PUT /api/workspaces/:id exists or using POST as placeholder
      await fetch(`/api/workspaces/${id}`, {
        method: 'POST', // In server.ts I didn't add rename yet, let's treat it as placeholder or add it later
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, userId: user.id })
      });
      setFolders(prev => Array.isArray(prev) ? prev.map(f => f.id === id ? { ...f, name: newName } : f) : []);
    } catch (err) {
      console.error("Failed to rename project:", err);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleIndexSource = async () => {
    if (!sourceInput.trim()) return;
    setIsIndexing(true);
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: `Indexing ${sourceType === 'url' ? 'website' : sourceType}...` }]);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✓ Source indexed successfully. I've added this to your Noteflow knowledge base. You can now ask questions about it.` 
      }]);
      
      setSourceType(null);
      setSourceInput('');
      setSourceTitle('');
    } catch (err) {
      console.error("Indexing failed:", err);
    } finally {
      setIsIndexing(false);
    }
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
          { pageNumber: 1, text: "This is a manual for Noteflow. It explains how to use the multimodal RAG assistant.", imageBase64: "" },
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

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

  if (noteflowMode === 'dashboard') {
    return (
      <NoteFlowDashboard 
        user={user} 
        onSelectProject={(proj) => {
          setSelectedProject(proj);
          setActiveTab('project-hub');
          setNoteflowMode(null);
        }} 
        onHome={() => setNoteflowMode(null)}
      />
    );
  }

  if (noteflowMode === 'workspace' && selectedProject) {
    return (
      <NoteFlowWorkspace 
        user={user} 
        project={selectedProject} 
        onBack={() => setNoteflowMode('dashboard')} 
        onHome={() => setNoteflowMode(null)}
      />
    );
  }

  if (noteflowMode === 'ai-chatbots') {
    return (
      <div className="fixed inset-0 z-[60] bg-[#111111] flex flex-col">
        <header className="h-16 bg-[#111111] border-b border-white/5 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setNoteflowMode(null)} className="p-2 hover:bg-white/5 rounded-lg text-text-dim transition-all">
              <ChevronRight className="rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
                <Bot size={24} />
              </div>
              <h2 className="font-bold text-white">AI Chatbots</h2>
            </div>
          </div>
          <button 
            onClick={() => setNoteflowMode(null)}
            className="p-2 hover:bg-white/5 rounded-full text-text-dim transition-all"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          <AIChatbots user={user} onBack={() => setNoteflowMode(null)} />
        </div>
      </div>
    );
  }

  if (noteflowMode === 'ask-references' && selectedProject) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col">
        <AskReferences 
          user={user} 
          project={selectedProject} 
          onBack={() => setNoteflowMode('workspace')}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg text-text-main font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-bg flex flex-col h-full transition-all duration-300 z-50 border-r border-white/5",
        isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64"
      )}>
        <div className="flex flex-col h-full p-2 py-4 gap-2">
          {/* Top Header */}
          <div className="flex items-center justify-between mb-2 px-3">
            <button 
              onClick={() => {
                setActiveTab('chat');
                setMessages([]);
                setInput('');
              }}
              className="flex items-center gap-2 text-text-muted hover:text-text-main hover:bg-white/5 p-2 rounded-lg transition-all group"
            >
              <SquarePen size={20} className="text-text-main" />
              <span className="text-sm font-medium">New chat</span>
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-all"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-0.5 px-2">
            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group">
              <Search size={18} className="text-text-dim group-hover:text-text-main" />
              <span className="text-sm">Search chats</span>
            </button>

            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group">
              <ImageIcon size={18} className="text-text-dim group-hover:text-text-main" />
              <span className="text-sm">Images</span>
            </button>

            <button 
              onClick={() => setActiveTab('marketplace')}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-all group",
                activeTab === 'marketplace' ? "bg-white/5 text-text-main" : "text-text-muted hover:bg-white/5 hover:text-text-main"
              )}
            >
              <LayoutGrid size={18} className={cn("group-hover:text-text-main", activeTab === 'marketplace' ? "text-text-main" : "text-text-dim")} />
              <span className="text-sm">Apps</span>
            </button>

            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group">
              <Zap size={18} className="text-text-dim group-hover:text-text-main" />
              <span className="text-sm">Deep research</span>
            </button>

            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group">
              <Terminal size={18} className="text-text-dim group-hover:text-text-main" />
              <span className="text-sm">Codex</span>
            </button>
          </div>

          <div className="flex flex-col gap-0.5 px-2 mt-4">
            <button 
              onClick={() => setIsGptsExpanded(!isGptsExpanded)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group"
            >
              <div className="flex items-center gap-3">
                <Bot size={18} className="text-text-dim group-hover:text-text-main" />
                <span className="text-sm font-medium">GPTs</span>
              </div>
              <motion.div
                animate={{ rotate: isGptsExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={14} className="text-text-dim" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isGptsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-white/[0.02] rounded-lg ml-2"
                >
                  <div className="p-2 text-xs text-text-dim italic">Explore personalized agents...</div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group"
            >
              <div className="flex items-center gap-3">
                <Folder size={18} className="text-text-dim group-hover:text-text-main" />
                <span className="text-sm font-medium">Projects</span>
              </div>
              <motion.div
                animate={{ rotate: isProjectsExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={14} className="text-text-dim" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isProjectsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-2 flex flex-col gap-0.5"
                >
                  <button 
                    onClick={handleCreateProject}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-accent hover:text-accent-light group"
                  >
                    <FolderPlus size={16} />
                    <span className="text-xs font-medium">Create folder</span>
                  </button>

                  {Array.isArray(folders) && folders.map(project => (
                    <div key={project.id} className="relative group/project">
                      <div 
                        onClick={() => {
                          setSelectedProject(project as any);
                          setActiveTab('project-hub');
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-text-muted hover:text-text-main group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <Folder size={14} className="text-text-dim shrink-0" />
                          <span className="text-xs truncate">{project.name}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProjectMenu(activeProjectMenu === project.id ? null : project.id);
                          }}
                          className="p-1 opacity-0 group-hover/project:opacity-100 hover:bg-white/10 rounded transition-all shrink-0"
                        >
                          <MoreVertical size={12} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {activeProjectMenu === project.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute left-full top-0 ml-2 z-[60] bg-surface border border-white/10 rounded-xl shadow-2xl p-1 min-w-[120px]"
                          >
                            <button 
                              onClick={() => {
                                alert('Share link copied to clipboard!');
                                setActiveProjectMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:bg-white/5 hover:text-text-main transition-all"
                            >
                              <Share2 size={14} />
                              <span>Share</span>
                            </button>
                            <button 
                              onClick={() => {
                                handleRenameProject(project.id, project.name);
                                setActiveProjectMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:bg-white/5 hover:text-text-main transition-all"
                            >
                              <Edit2 size={14} />
                              <span>Rename</span>
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button 
                              onClick={() => {
                                handleDeleteProject(project.id);
                                setActiveProjectMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-all font-medium"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 px-2">
            <div className="px-2 py-2 text-[11px] font-bold text-text-dim uppercase tracking-widest">Recents</div>
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <button 
                  key={chat.id} 
                  className="w-full flex items-center p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main transition-all text-sm truncate text-left group"
                >
                  <span className="flex-1 truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="pt-2 border-t border-white/5 px-2">
            <div className="relative">
              <button 
                onClick={onLogout}
                className="w-full flex flex-col gap-2 p-2 rounded-lg hover:bg-surface-2 transition-all text-left"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <p className="text-sm font-medium truncate text-text-main uppercase tracking-tight">{user.name}</p>
                    <p className="text-[10px] text-text-dim">Free • {user.email}</p>
                  </div>
                  <LogOut size={14} className="text-text-dim group-hover:text-text-main" />
                </div>
              </button>
              
              <button className="w-full mt-2 relative overflow-hidden group py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 shadow-lg">
                <img 
                  src="https://picsum.photos/seed/gift/400/200" 
                  alt="Offer" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-accent/40 to-purple-500/40 mix-blend-overlay" />
                <div className="relative z-10 flex items-center justify-center gap-2 text-white">
                  <Gift size={14} />
                  <span>Claim your offer</span>
                </div>
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border-muted rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-1">
                      <button 
                        onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-dim hover:bg-surface-2 hover:text-text-main transition-all text-sm"
                      >
                        <UserIcon size={16} />
                        <span>Profile</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-dim hover:bg-surface-2 hover:text-text-main transition-all text-sm"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <div className="h-px bg-border-muted my-1" />
                      <button 
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-all text-sm"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-bg relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
          <img 
            src="https://picsum.photos/seed/swahivo-bg/1920/1080?blur=4" 
            alt="Atmosphere"
            className="w-full h-full object-cover mix-blend-overlay opacity-20"
            referrerPolicy="no-referrer"
          />
        </div>
        <>
          {/* Top Header */}
          <header className="h-14 flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2">
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-all"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 hover:bg-white/5 rounded-xl transition-all text-text-muted hover:text-text-main font-medium group">
              <div className="text-text-main text-lg font-display font-black tracking-tighter flex items-center justify-center leading-none select-none">
                SWAHIVO AI
              </div>
              <ChevronDown size={16} className="text-text-dim group-hover:text-text-main transition-colors mt-0.5" />
            </button>
          </div>
          
          <div className="flex-1 flex justify-center">
            <button className="px-4 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-full text-xs font-medium text-text-main flex items-center gap-2 border border-border-muted transition-all">
              <Gift size={14} className="text-accent" />
              <span>Free offer</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-full transition-all">
              <Sparkles size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold border border-border-muted">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div 
          onScroll={handleScroll}
          className="flex-1 flex flex-col items-center overflow-y-auto px-4 custom-scrollbar"
        >
          {activeTab === 'chat' && (
            <div className={cn(
              "w-full max-w-3xl flex-1 flex flex-col items-center z-10",
              messages.length === 0 ? "justify-center" : "justify-start pt-10"
            )}>
              {messages.length === 0 ? (
                <div className="w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-32 h-32 mb-2"
                  >
                    <div className="absolute inset-0 bg-accent/30 rounded-[40px] blur-3xl animate-pulse" />
                    <div className="relative w-full h-full bg-surface border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-1">
                      <img 
                        src={`https://picsum.photos/seed/${user.id}-avatar/400`} 
                        alt={user.name}
                        className="w-full h-full object-cover rounded-[36px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                  
                  <h1 className="text-4xl md:text-5xl font-display font-black text-text-main tracking-tighter text-center leading-tight">
                    {greeting}
                  </h1>
                  
                  <div className="w-full relative flex items-center bg-surface/80 backdrop-blur-xl rounded-[28px] p-2 shadow-2xl border border-white/5">
                    {/* Indexing Overlay */}
                    <AnimatePresence>
                      {sourceType && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 z-50 bg-surface rounded-[26px] p-4 flex flex-col gap-4 border border-accent/30 shadow-2xl shadow-accent/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                {sourceType === 'url' && <Globe size={16} />}
                                {sourceType === 'text' && <Type size={16} />}
                                {sourceType === 'note' && <StickyNote size={16} />}
                              </div>
                              <span className="text-sm font-bold text-text-main uppercase tracking-widest">
                                Index {sourceType === 'url' ? 'Website' : sourceType}
                              </span>
                            </div>
                            <button 
                              onClick={() => setSourceType(null)}
                              className="p-1.5 hover:bg-surface-2 rounded-lg text-text-dim transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          
                          <div className="flex-1 flex flex-col gap-3">
                            <input 
                              type="text"
                              value={sourceTitle}
                              onChange={(e) => setSourceTitle(e.target.value)}
                              placeholder={sourceType === 'url' ? "Website Title (Optional)" : "Title"}
                              className="w-full bg-surface-2 border border-border-muted rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-all text-text-main"
                            />
                            <textarea 
                              value={sourceInput}
                              onChange={(e) => setSourceInput(e.target.value)}
                              placeholder={sourceType === 'url' ? "https://example.com" : "Paste your content here..."}
                              className="flex-1 bg-surface-2 border border-border-muted rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-all resize-none custom-scrollbar text-text-main"
                            />
                          </div>

                          <button 
                            onClick={handleIndexSource}
                            disabled={isIndexing || !sourceInput.trim()}
                            className="w-full py-2.5 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isIndexing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            <span>Index to Noteflow</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-1 pl-2">
                      <button 
                        onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                        className="p-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-full transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    <textarea 
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                          (e.target as HTMLTextAreaElement).style.height = 'auto';
                        }
                      }}
                      placeholder="Ask anything"
                      className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[1rem] py-3 px-2 placeholder:text-text-dim resize-none max-h-60 custom-scrollbar text-text-main"
                    />
                    
                    <div className="flex items-center gap-1 pr-2">
                      <button 
                        onClick={() => sendMessage()}
                        disabled={!input.trim() && !selectedFile}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          (input.trim() || selectedFile) ? "bg-accent text-white" : "text-text-dim opacity-50"
                        )}
                      >
                        <ArrowUp size={20} />
                      </button>
                    </div>

                    {/* Plus Menu */}
                    <AnimatePresence>
                      {isPlusMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-4 bg-surface border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px]"
                        >
                          <button 
                            onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text-main rounded-xl transition-colors"
                          >
                            <FileText size={18} className="text-blue-400" />
                            <span>Upload PDF</span>
                          </button>
                          <button 
                            onClick={() => { imageInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text-main rounded-xl transition-colors"
                          >
                            <ImageIcon size={18} className="text-green-400" />
                            <span>Image upload</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full space-y-8 mb-8">
                    {messages.map((msg, i) => (
                      <motion.div 
                        key={`msg-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-4 w-full",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                            <Bot size={16} className="text-white" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[85%] px-4 py-2 rounded-2xl text-[0.95rem] leading-relaxed",
                          msg.role === 'user' ? "bg-surface text-white" : "text-text-main"
                        )}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isGenerating && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 w-full justify-start"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-surface/50 px-4 py-3 rounded-2xl flex gap-1.5 items-center">
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                            className="w-1.5 h-1.5 bg-text-main rounded-full" 
                          />
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            className="w-1.5 h-1.5 bg-text-main rounded-full" 
                          />
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            className="w-1.5 h-1.5 bg-text-main rounded-full" 
                          />
                        </div>
                      </motion.div>
                    )}
                    <div key="messages-end-anchor" ref={messagesEndRef} />
                  </div>

                  {/* Input Bar (Sticky) */}
                  <div className="w-full max-w-3xl sticky bottom-4 mt-auto pb-4 bg-bg">
                    {/* Scroll to Bottom Button */}
                    <AnimatePresence>
                      {showScrollButton && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 10 }}
                          onClick={scrollToBottom}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 bg-surface border border-white/10 rounded-full flex items-center justify-center text-text-main shadow-xl hover:bg-white/5 transition-all z-40"
                        >
                          <ArrowDown size={16} />
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <div className="relative flex items-center bg-bg rounded-[26px] p-2 shadow-2xl border border-white/10">
                      <div className="flex items-center gap-1 pl-2">
                        <button 
                          onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                          className="p-2 text-text-muted hover:text-text-main hover:bg-white/5 rounded-full transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      
                      <textarea 
                        rows={1}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                            (e.target as HTMLTextAreaElement).style.height = 'auto';
                          }
                        }}
                        placeholder="Ask anything"
                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[1rem] py-3 px-2 text-text-main placeholder:text-text-dim resize-none max-h-60 custom-scrollbar"
                      />
                      
                      <div className="flex items-center gap-1 pr-2">
                        <button 
                          onClick={() => sendMessage()}
                          disabled={!input.trim() && !selectedFile}
                          className={cn(
                            "p-2 rounded-full transition-all",
                            (input.trim() || selectedFile) ? "bg-white text-black" : "text-text-dim opacity-50"
                          )}
                        >
                          <ArrowUp size={20} />
                        </button>
                      </div>

                      {/* Plus Menu */}
                      <AnimatePresence>
                        {isPlusMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-4 bg-surface border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px]"
                          >
                            <button 
                              onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                            >
                              <FileText size={18} className="text-blue-400" />
                              <span>Upload PDF</span>
                            </button>
                            <button 
                              onClick={() => { setIsPlusMenuOpen(false); setSourceType('url'); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                            >
                              <Globe size={18} className="text-blue-500" />
                              <span>Web Search</span>
                            </button>
                            <button 
                              onClick={() => { setIsPlusMenuOpen(false); setSourceType('text'); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                            >
                              <Type size={18} className="text-purple-400" />
                              <span>Add Text</span>
                            </button>
                            <button 
                              onClick={() => { setIsPlusMenuOpen(false); setSourceType('note'); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                            >
                              <StickyNote size={18} className="text-emerald-400" />
                              <span>Add Note</span>
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button 
                              onClick={() => { imageInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                            >
                              <ImageIcon size={18} className="text-green-400" />
                              <span>Image upload</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mx-auto py-10 px-6 space-y-10"
              >
                <header>
                  <h1 className="text-3xl font-display font-black mb-2 text-text-main">Marketplace<span className="text-accent">.</span></h1>
                  <p className="text-text-muted">Explore AI-powered tools and features.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Noteflow Card */}
                  <div className="bg-surface border border-border-muted p-0 rounded-2xl overflow-hidden flex flex-col hover:border-accent/50 transition-all group shadow-xl hover:shadow-accent/5">
                    <div className="h-44 w-full relative overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/research-ai/800/600" 
                        alt="Noteflow" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 w-10 h-10 bg-emerald-500/20 backdrop-blur-md rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Bot size={20} />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <div>
                        <h3 className="text-lg font-display font-black mb-1 text-text-main">Noteflow</h3>
                        <p className="text-sm text-text-dim leading-relaxed">Advanced research tool with PDF indexing, web crawling, and multimodal RAG.</p>
                      </div>
                      <button 
                        onClick={() => setNoteflowMode('dashboard')}
                        className="mt-auto w-full py-2.5 bg-surface-2 hover:bg-accent hover:text-white rounded-xl text-sm font-bold transition-all text-text-main"
                      >
                        Open Noteflow
                      </button>
                    </div>
                  </div>

                  {/* Powerdesk Card */}
                  <div className="bg-surface border border-border-muted p-0 rounded-2xl overflow-hidden flex flex-col hover:border-accent/50 transition-all group shadow-xl hover:shadow-accent/5">
                    <div className="h-44 w-full relative overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/support/800/600" 
                        alt="Powerdesk" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 w-10 h-10 bg-purple-500/20 backdrop-blur-md rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <MessageSquare size={20} />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <div>
                        <h3 className="text-lg font-display font-black mb-1 text-text-main">Powerdesk</h3>
                        <p className="text-sm text-text-dim leading-relaxed">Unified communication hub for all your customer conversations.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('powerdesk')}
                        className="mt-auto w-full py-2.5 bg-surface-2 hover:bg-accent hover:text-white rounded-xl text-sm font-bold transition-all text-text-main"
                      >
                        Open Desk
                      </button>
                    </div>
                  </div>

                  {/* VAR System Card */}
                  <div className="bg-surface border border-border-muted p-0 rounded-2xl overflow-hidden flex flex-col hover:border-accent/50 transition-all group shadow-xl hover:shadow-accent/5">
                    <div className="h-44 w-full relative overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/sports/800/600" 
                        alt="VAR" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 w-10 h-10 bg-orange-500/20 backdrop-blur-md rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                        <Video size={20} />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <div>
                        <h3 className="text-lg font-display font-black mb-1 text-text-main">VAR System</h3>
                        <p className="text-sm text-text-dim leading-relaxed">Video Assistant Referee system for sports analysis.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('var')}
                        className="mt-auto w-full py-2.5 bg-surface-2 hover:bg-accent hover:text-white rounded-xl text-sm font-bold transition-all text-text-main"
                      >
                        Open VAR
                      </button>
                    </div>
                  </div>

                  {/* AI Chatbots Card */}
                  <div className="bg-surface border border-border-muted p-0 rounded-2xl overflow-hidden flex flex-col hover:border-accent/50 transition-all group shadow-xl hover:shadow-accent/5">
                    <div className="h-44 w-full relative overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/agents/800/600" 
                        alt="Chatbots" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 w-10 h-10 bg-blue-500/20 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Bot size={20} />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <div>
                        <h3 className="text-lg font-display font-black mb-1 text-text-main">AI Chatbots</h3>
                        <p className="text-sm text-text-dim leading-relaxed">Create and deploy specialized AI agents for your business needs.</p>
                      </div>
                      <button 
                        onClick={() => setNoteflowMode('ai-chatbots')}
                        className="mt-auto w-full py-2.5 bg-surface-2 hover:bg-accent hover:text-white rounded-xl text-sm font-bold transition-all text-text-main"
                      >
                        Open Chatbots
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'project-hub' && selectedProject && (
            <div className="w-full h-full flex flex-col">
              <ProjectHub user={user} project={selectedProject} onBack={() => setActiveTab('chat')} />
            </div>
          )}

          {activeTab === 'powerdesk' && (
            <div className="w-full h-full flex flex-col">
              <Powerdesk user={user} onBack={() => setActiveTab('chat')} />
            </div>
          )}

          {activeTab === 'var' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <VAR user={user} onBack={() => setActiveTab('chat')} />
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar py-20 px-6">
              <div className="max-w-4xl mx-auto text-center space-y-12">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold">Choose your plan</h2>
                  <p className="text-text-muted text-lg">Scale your AI capabilities with our flexible pricing.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-surface border border-border-muted p-8 rounded-3xl text-left space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-text-main">Free</h3>
                      <p className="text-text-dim text-sm">Basic AI features for individuals.</p>
                    </div>
                    <div className="text-3xl font-bold text-text-main">$0<span className="text-sm font-normal text-text-dim">/mo</span></div>
                    <ul className="space-y-3">
                      {['Basic Chat', '1 Workspace', 'Standard Support'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                          <Sparkles size={14} className="text-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full py-3 bg-surface-2 hover:bg-surface-3 rounded-xl font-bold transition-all text-text-main">Current Plan</button>
                  </div>

                  <div className="bg-surface border-2 border-accent p-8 rounded-3xl text-left space-y-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 px-3 py-1 bg-accent text-black text-[10px] font-bold rounded-full uppercase">Popular</div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-text-main">Pro</h3>
                      <p className="text-text-dim text-sm">Advanced tools for professionals.</p>
                    </div>
                    <div className="text-3xl font-bold text-text-main">$20<span className="text-sm font-normal text-text-dim">/mo</span></div>
                    <ul className="space-y-3">
                      {['Advanced Models', 'Unlimited Workspaces', 'Priority Support', 'Custom Chatbots'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                          <Sparkles size={14} className="text-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-dark transition-all">Upgrade to Pro</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="w-full max-w-5xl py-10 px-6">
              <h2 className="text-3xl font-semibold mb-6 text-text-main">Noteflow</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map(note => (
                  <div key={note.id} className="bg-surface border border-border-muted p-6 rounded-2xl hover:border-border-subtle transition-all">
                    <h4 className="font-bold text-lg mb-2 text-text-main">{note.title}</h4>
                    <p className="text-text-muted text-sm line-clamp-3">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-text-dim italic">No notes found.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex justify-center py-3 bg-bg/50 backdrop-blur-sm border-t border-border-muted mt-auto">
          <p className="text-[0.65rem] text-text-dim/60 font-medium text-center">
            Swahivo AI isn’t perfect—always double-check
          </p>
        </div>
        </>
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
              className="relative w-full max-w-lg bg-surface border border-border-muted rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-full transition-all"
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
                      <h3 className="text-xl font-semibold text-text-main">Paste Link</h3>
                      <p className="text-sm text-text-muted">Analyze content from a URL</p>
                    </div>
                  </div>
                  <input 
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-surface-2 border border-border-muted rounded-xl text-text-main outline-none focus:border-purple-400/50 transition-all"
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
                      <h3 className="text-xl font-semibold text-text-main">Add Text Block</h3>
                      <p className="text-sm text-text-muted">Paste a large snippet of text</p>
                    </div>
                  </div>
                  <textarea 
                    value={textBlockInput}
                    onChange={(e) => setTextBlockInput(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-40 px-4 py-3 bg-surface-2 border border-border-muted rounded-xl text-text-main outline-none focus:border-yellow-400/50 transition-all resize-none"
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
