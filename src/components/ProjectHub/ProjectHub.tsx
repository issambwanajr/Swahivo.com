import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  Search, 
  MessageSquare, 
  FileBox, 
  Zap, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  ArrowUpRight,
  ChevronRight,
  MoreVertical,
  Bot,
  BrainCircuit,
  Share2,
  Trash2,
  LayoutGrid,
  FileText,
  Clock,
  Code,
  Image as ImageIcon,
  LogOut,
  ExternalLink,
  Download
} from 'lucide-react';
import { Project, User, ProjectOutput, WorkspaceDocument } from '../../types';
import { cn } from '@/src/lib/utils';
import { NoteFlowWorkspace } from '../NoteFlow/NoteFlowWorkspace';

interface ProjectHubProps {
  user: User;
  project: Project;
  onBack: () => void;
}

type ProjectView = 'overview' | 'chat' | 'knowledge' | 'assets' | 'collaboration' | 'analytics' | 'settings' | 'workflows';

export function ProjectHub({ user, project, onBack }: ProjectHubProps) {
  const [activeView, setActiveView] = useState<ProjectView>('overview');
  const [outputs, setOutputs] = useState<ProjectOutput[]>([]);
  const [docs, setDocs] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [outputsResp, docsResp] = await Promise.all([
        fetch(`/api/workspaces/${project.id}/messages`), // We use outputs as messages/chat_history for now
        fetch(`/api/workspaces/${project.id}/documents`)
      ]);
      
      const outputsData = await outputsResp.json();
      const docsData = await docsResp.json();
      
      setOutputs(Array.isArray(outputsData) ? outputsData : []);
      setDocs(Array.isArray(docsData) ? docsData : []);
    } catch (err) {
      console.error("Failed to fetch project data:", err);
      setOutputs([]);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'chat', label: 'Agentic Research', icon: Zap },
    { id: 'knowledge', label: 'Knowledge Base', icon: BrainCircuit },
    { id: 'assets', label: 'Files & Assets', icon: FileBox },
    { id: 'workflows', label: 'Workflows', icon: Code },
    { id: 'collaboration', label: 'Team', icon: Users },
    { id: 'analytics', label: 'Usage', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-dim text-xs font-mono uppercase tracking-widest">
                <Folder size={12} />
                <span>Projects</span>
                <ChevronRight size={12} />
                <span className="text-text-main">{project.name}</span>
              </div>
              <h1 className="text-4xl font-display font-black text-text-main leading-tight">
                Mission Control<span className="text-accent">.</span>
              </h1>
              <p className="text-text-muted text-sm max-w-2xl">
                Everything related to {project.name}. Manage your AI research, knowledge assets, and team collaboration in one unified hub.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="bg-surface border border-white/5 p-6 rounded-[24px] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Zap size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-accent px-2 py-1 bg-accent/10 rounded-full">LIVE</span>
                </div>
                <div>
                  <div className="text-3xl font-display font-black text-text-main">2.4k</div>
                  <div className="text-xs text-text-dim uppercase tracking-tighter">Credits Used</div>
                </div>
              </div>

              <div className="bg-surface border border-white/5 p-6 rounded-[24px] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <FileText size={20} />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-display font-black text-text-main">18</div>
                  <div className="text-xs text-text-dim uppercase tracking-tighter">Generated Assets</div>
                </div>
              </div>

              <div className="bg-surface border border-white/5 p-6 rounded-[24px] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Users size={20} />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-display font-black text-text-main">12</div>
                  <div className="text-xs text-text-dim uppercase tracking-tighter">Collaborators</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-black text-text-main">Recent Outputs</h2>
                  <button className="text-xs text-accent hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {outputs.map(output => (
                    <div key={output.id} className="group bg-surface/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-accent/30 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-dim group-hover:text-accent transition-colors">
                        {output.type === 'text' ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-text-main">{output.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-tighter">
                          <Clock size={10} />
                          <span>{new Date(output.created_at).toLocaleDateString()}</span>
                          <span className="opacity-20">•</span>
                          <span>{output.type}</span>
                        </div>
                      </div>
                      <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-display font-black text-text-main">Project Goals</h2>
                <div className="bg-surface/50 border border-white/5 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-medium text-text-main">Train specialized Chatbot</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-medium text-text-main">Analyze 100+ PDF documents</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-2 h-2 rounded-full bg-text-dim" />
                    <span className="text-sm font-medium text-text-dim">Setup multi-channel integration</span>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 p-6 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Automation Workflow</h4>
                  <p className="text-xs text-text-muted">Currently processing document vectorization. Estimated finish in 4 mins.</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'assets':
        return (
          <div className="p-8 space-y-6">
            <header>
              <h2 className="text-2xl font-display font-black text-text-main mb-2">Project Assets</h2>
              <p className="text-text-muted text-sm">Manage all files, URLs and notes used in this project.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(doc => (
                <div key={doc.id} className="bg-surface border border-white/5 p-4 rounded-2xl hover:border-accent/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-accent">
                      {doc.type === 'pdf' ? <FileText size={20} /> : <ExternalLink size={20} />}
                    </div>
                    <button className="text-text-dim hover:text-red-400 p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-text-main mb-1 truncate">{doc.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-tighter mb-4">
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-text-main flex items-center justify-center gap-2 transition-all">
                    <Download size={14} />
                    DOWNLOAD
                  </button>
                </div>
              ))}
              
              <button className="border-2 border-dashed border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-accent/30 hover:bg-white/[0.02] transition-all group min-h-[160px]">
                <Plus size={24} className="text-text-dim group-hover:text-accent group-hover:scale-110 transition-all" />
                <span className="text-xs font-bold text-text-dim group-hover:text-text-main">Add Asset</span>
              </button>
            </div>
          </div>
        );
      case 'knowledge':
        return (
          <div className="p-8 space-y-6">
            <header>
              <h2 className="text-2xl font-display font-black text-text-main mb-2">Knowledge Base</h2>
              <p className="text-text-muted text-sm">The semantic core of your project. Vectors and embeddings for AI retrieval.</p>
            </header>
            <div className="bg-surface/50 border border-white/5 p-12 rounded-[32px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-[40px] bg-accent/20 flex items-center justify-center text-accent mb-6">
                <BrainCircuit size={40} />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">AI Knowledge Graph</h3>
              <p className="text-sm text-text-muted max-w-sm mb-8">This project has {docs.length} indexed entities. Your AI tools will automatically reference these during research.</p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="p-4 rounded-2xl bg-white/5 text-left">
                  <div className="text-xs text-text-dim uppercase tracking-widest mb-1">Vectors</div>
                  <div className="text-2xl font-bold text-text-main">1.2k</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 text-left">
                  <div className="text-xs text-text-dim uppercase tracking-widest mb-1">Index Health</div>
                  <div className="text-2xl font-bold text-accent">98%</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="h-full">
            <NoteFlowWorkspace 
              user={user}
              project={project}
              onBack={() => setActiveView('overview')}
              onHome={onBack}
            />
          </div>
        );
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-text-dim animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-[40px] bg-white/5 flex items-center justify-center mb-6">
              {sidebarItems.find(i => i.id === activeView)?.icon && React.createElement(sidebarItems.find(i => i.id === activeView)!.icon, { size: 40 })}
            </div>
            <h2 className="text-2xl font-display font-black text-text-main mb-2">
              {sidebarItems.find(i => i.id === activeView)?.label}
            </h2>
            <p className="text-sm max-w-md text-center">
              This module is currently being optimized for Project {project.name}. Stay tuned for advanced {activeView} capabilities.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full bg-bg">
      {/* Sub-sidebar for Project Management */}
      <aside className="w-64 border-r border-white/5 flex flex-col pt-6 z-20">
        <div className="px-6 mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-text-dim hover:text-text-main transition-colors mb-4 group"
          >
            <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO FLEET</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <Folder size={20} />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-display font-black text-text-main truncate uppercase tracking-tighter">
                {project.name}
              </h2>
              <p className="text-[10px] text-text-dim truncate">Project Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ProjectView)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group",
                activeView === item.id 
                  ? "bg-accent text-white shadow-lg shadow-accent/10" 
                  : "text-text-muted hover:bg-white/5 hover:text-text-main"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-colors",
                activeView === item.id ? "text-white" : "text-text-dim group-hover:text-text-main"
              )} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-surface border border-bg flex items-center justify-center text-[8px] font-bold text-text-dim">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <button className="w-6 h-6 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-text-dim hover:text-accent transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted transition-all">
            Invite Team
          </button>
        </div>
      </aside>

      {/* Project Content Stage */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeView !== 'chat' && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[160px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[140px]" />
          </div>
        )}
        
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
