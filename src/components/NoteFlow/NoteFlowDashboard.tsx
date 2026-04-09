import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Folder, Trash2, Clock, Search } from 'lucide-react';
import { Workspace, User } from '../../types';
import { cn } from '../../lib/utils';

interface NoteFlowDashboardProps {
  user: User;
  onSelectWorkspace: (workspace: Workspace) => void;
}

export function NoteFlowDashboard({ user, onSelectWorkspace }: NoteFlowDashboardProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch(`/api/workspaces?userId=${user.id}`);
      const data = await res.json();
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
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
      const newWs = await res.json();
      setWorkspaces([newWs, ...workspaces]);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      setWorkspaces(workspaces.filter(w => w.id !== id));
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1a1a] p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-serif font-medium tracking-tight mb-2">Noteflow LM</h1>
            <p className="text-[#666] text-lg">Powered by Noteflow LM & Gemini Embedding 2</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#2e2e2e] text-white rounded-full font-medium hover:bg-black transition-all shadow-lg shadow-black/5"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </header>

        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={20} />
          <input 
            type="text" 
            placeholder="Search your projects..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-[#e8e5e0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#9a7a52]/20 focus:border-[#9a7a52] transition-all"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white border border-[#e8e5e0] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <motion.div
                key={ws.id}
                layoutId={ws.id}
                onClick={() => onSelectWorkspace(ws)}
                className="group relative bg-white border border-[#e8e5e0] p-8 rounded-[32px] cursor-pointer hover:border-[#9a7a52] hover:shadow-xl hover:shadow-[#9a7a52]/5 transition-all flex flex-col justify-between h-56"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#f2f0ec] rounded-2xl flex items-center justify-center text-[#9a7a52]">
                      <Folder size={24} />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(ws.id, e)}
                      className="p-2 text-[#ccc] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#9a7a52] transition-colors">{ws.name}</h3>
                  <p className="text-[#888] text-sm line-clamp-2">{ws.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 text-[#aaa] text-xs font-medium uppercase tracking-wider">
                  <Clock size={14} />
                  <span>{new Date(ws.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}

            {workspaces.length === 0 && (
              <div 
                key="no-workspaces-empty"
                onClick={() => setIsCreateModalOpen(true)}
                className="border-2 border-dashed border-[#e8e5e0] p-8 rounded-[32px] flex flex-col items-center justify-center text-[#999] hover:border-[#9a7a52] hover:text-[#9a7a52] transition-all h-56 cursor-pointer group"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-[#e8e5e0]"
          >
            <h2 className="text-2xl font-serif font-bold mb-6">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#666] mb-2 uppercase tracking-wider">Project Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Travel Research"
                  className="w-full px-4 py-3 bg-[#f9f8f6] border border-[#e8e5e0] rounded-xl focus:outline-none focus:border-[#9a7a52] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#666] mb-2 uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this project about?"
                  className="w-full px-4 py-3 bg-[#f9f8f6] border border-[#e8e5e0] rounded-xl focus:outline-none focus:border-[#9a7a52] transition-all h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 bg-[#f2f0ec] text-[#666] rounded-xl font-bold hover:bg-[#e8e5e0] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 py-3 bg-[#2e2e2e] text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
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
