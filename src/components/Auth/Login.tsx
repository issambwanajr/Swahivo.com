import React from 'react';
import { useAuth } from '../Firebase/AuthProvider';
import { motion } from 'motion/react';
import { LogIn, Plus, Mic, HelpCircle, ChevronDown } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-[#171717] text-[#ececec] flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-semibold hover:bg-white/5 px-2 py-1 rounded-md cursor-pointer transition-colors">
            <span>ChatGPT</span>
            <ChevronDown size={14} className="text-white/50" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Learn</a>
            <a href="#" className="hover:text-white transition-colors">Business</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors text-[#c477ff]">Images</a>
            <a href="#" className="hover:text-white transition-colors text-[#ff90e8]">Download</a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={loginWithGoogle}
            className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-full transition-colors"
          >
            Log in
          </button>
          <button 
            onClick={loginWithGoogle}
            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition-colors"
          >
            Sign up for free
          </button>
          <HelpCircle size={20} className="text-white/50 cursor-pointer hover:text-white transition-colors" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-20 px-4">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-[40px] font-medium text-white/90 mb-8 text-center"
        >
          What's on the agenda today?
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full max-w-[768px] relative group"
        >
          <div className="bg-[#2f2f2f] rounded-3xl border border-white/10 p-4 transition-all focus-within:ring-1 focus-within:ring-white/20">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-sm hover:bg-white/5 transition-colors">
                <Plus size={16} />
                <span>Add</span>
              </button>
              <input 
                type="text" 
                placeholder="Ask anything"
                className="flex-1 bg-transparent border-none outline-none text-base placeholder-white/30"
              />
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/60">
                <Mic size={18} />
                <span>Voice</span>
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/50 hover:bg-white/5 transition-colors">Analyze data</button>
            <button className="px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/50 hover:bg-white/5 transition-colors">Summarize text</button>
            <button className="px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/50 hover:bg-white/5 transition-colors">Brainstorm ideas</button>
            <button className="px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/50 hover:bg-white/5 transition-colors">Write code</button>
          </div>
        </motion.div>
      </main>

      {/* Footer / Login CTA */}
      <footer className="p-8 text-center text-[11px] text-white/30">
        <p>Swahivo AI can make mistakes. Check important info.</p>
      </footer>
    </div>
  );
};
