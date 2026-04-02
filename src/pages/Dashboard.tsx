import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, MessageSquare, Settings, LogOut, User, BarChart3 } from 'lucide-react';
import { Hero } from '../components/Hero';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border-subtle flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">S</div>
            <span className="text-xl font-bold text-text-main">Swahivo</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-text-main bg-surface-2 rounded-lg font-medium">
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors">
            <MessageSquare size={20} />
            Chats
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors">
            <BarChart3 size={20} />
            Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors">
            <Settings size={20} />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border-subtle flex items-center justify-between px-8 bg-surface/50 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-text-main">Welcome back, {user.user_metadata.full_name || user.email}</h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-muted">
              <User size={18} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* We can reuse the Hero component which contains the Chat */}
          <Hero />
        </div>
      </main>
    </div>
  );
}
