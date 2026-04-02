import React from 'react';
import { cn } from '@/src/lib/utils';

export function Navbar({ onLoginClick }: { onLoginClick?: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] h-14 flex items-center justify-between px-4 bg-bg">
      <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-2 px-3 py-1.5 rounded-lg transition-colors group">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
          <span className="font-bold text-[1.1rem]">S</span>
        </div>
        <span className="text-[1.25rem] font-semibold tracking-tight text-text-main">Swahivo</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onLoginClick}
          className="px-3 py-1.5 rounded-lg text-[0.88rem] font-medium text-text-main hover:bg-surface-2 transition-colors"
        >
          Log in
        </button>
        <button 
          onClick={onLoginClick}
          className="px-3 py-1.5 rounded-full bg-white text-black text-[0.88rem] font-medium hover:bg-white/90 transition-colors"
        >
          Sign up for free
        </button>
      </div>
    </nav>
  );
}
