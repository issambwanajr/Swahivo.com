import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Folder, Trash2, Clock, Search, ChevronRight } from 'lucide-react';
import { Project, User } from '../../types';
import { cn } from '../../lib/utils';

interface NoteFlowDashboardProps {
  user: User;
  onSelectProject: (project: Project) => void;
  onHome: () => void;
}

export function NoteFlowDashboard({ user, onSelectProject, onHome }: NoteFlowDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/workspaces?userId=${user.id}`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc, userId: user.id })
      });
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main p-8 lg:p-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <button 
              onClick={onHome}
              className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-4 group"
            >
              <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Home</span>
            </button>
            <h1 className="text-5xl font-display font-black tracking-tighter mb-2 text-text-main">Noteflow<span className="text-accent">.</span></h1>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-2 text-text-main rounded-full font-medium hover:bg-surface-3 transition-all shadow-lg shadow-black/5 border border-border-muted"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </header>

        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
          <input 
            type="text" 
            placeholder="Search your projects..."
            className="w-full pl-12 pr-6 py-4 bg-surface border border-border-muted rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-text-main"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-surface border border-border-muted rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <motion.div
                key={proj.id}
                layoutId={proj.id}
                onClick={() => onSelectProject(proj)}
                className="group relative bg-surface border border-border-muted p-8 rounded-[32px] cursor-pointer hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all flex flex-col justify-between h-56"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center text-accent">
                      <Folder size={24} />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{proj.name}</h3>
                  <p className="text-text-muted text-sm line-clamp-2">{proj.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 text-text-dim text-xs font-medium uppercase tracking-wider">
                  <Clock size={14} />
                  <span>{proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </motion.div>
            ))}

            {projects.length === 0 && (
              <div 
                key="no-projects-empty"
                onClick={() => setIsCreateModalOpen(true)}
                className="border-2 border-dashed border-border-muted p-8 rounded-[32px] flex flex-col items-center justify-center text-text-dim hover:border-accent hover:text-accent transition-all h-56 cursor-pointer group"
              >
                <Plus size={32} className="mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Create your first project</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-border-muted"
          >
            <h2 className="text-2xl font-serif font-bold mb-6">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Project Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Travel Research"
                  className="w-full px-4 py-3 bg-surface-2 border border-border-muted rounded-xl focus:outline-none focus:border-accent transition-all text-text-main"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this project about?"
                  className="w-full px-4 py-3 bg-surface-2 border border-border-muted rounded-xl focus:outline-none focus:border-accent transition-all h-24 resize-none text-text-main"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 bg-surface-2 text-text-muted rounded-xl font-bold hover:bg-surface-3 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
