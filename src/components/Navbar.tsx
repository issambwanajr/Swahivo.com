import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Navbar({ 
  onLoginClick, 
  theme, 
  onThemeToggle 
}: { 
  onLoginClick?: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] h-14 flex items-center justify-between px-4 bg-bg border-b border-border-subtle">
      <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-2 px-3 py-1.5 rounded-lg transition-colors group">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
          <span className="font-bold text-[1.1rem]">S</span>
        </div>
        <span className="text-[1.25rem] font-semibold tracking-tight text-text-main">Swahivo</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-2 transition-colors mr-2"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </nav>
  );
}
