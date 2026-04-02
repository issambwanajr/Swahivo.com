import React from 'react';
import { cn } from '@/src/lib/utils';
import { 
  Bot, 
  Puzzle, 
  Globe, 
  Code, 
  Search, 
  Monitor, 
  MessageSquare, 
  Image as ImageIcon, 
  ShoppingBag, 
  BookOpen, 
  Mic, 
  Video, 
  ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MegamenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: <Bot size={18} />, label: "Agent", desc: "Autonomous AI tasks", color: "text-accent" },
  { icon: <Puzzle size={18} />, label: "Apps", desc: "Integrated AI apps", color: "text-success" },
  { icon: <Globe size={18} />, label: "Atlas", desc: "World knowledge", color: "text-cyan" },
  { icon: <Code size={18} />, label: "Codex", desc: "AI-powered coding", color: "text-orange" },
  { icon: <Search size={18} />, label: "Deep Research", desc: "In-depth analysis", color: "text-pink" },
  { icon: <Monitor size={18} />, label: "Desktop App", desc: "Native experience", color: "text-text-muted" },
  { icon: <MessageSquare size={18} />, label: "Group Chats", desc: "Team collaboration", color: "text-accent-light" },
  { icon: <ImageIcon size={18} />, label: "Images", desc: "AI image generation", color: "text-orange" },
  { icon: <ShoppingBag size={18} />, label: "Shopping Research", desc: "Smart product search", color: "text-success" },
  { icon: <BookOpen size={18} />, label: "Study Mode", desc: "Learn anything", color: "text-cyan" },
  { icon: <Mic size={18} />, label: "Voice", desc: "Talk to Swahivo", color: "text-accent" },
  { icon: <Video size={18} />, label: "Voice with Video", desc: "See & hear together", color: "text-pink" },
  { icon: <ShieldCheck size={18} />, label: "Admin Panel", desc: "System management", color: "text-danger" },
];

export function Megamenu({ isOpen, onClose }: MegamenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[180] bg-black/20 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-14 left-0 right-0 z-[190] bg-surface border-b border-border-muted p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
          >
            {menuItems.map((item, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="flex items-center gap-3 p-3 rounded-r-sm hover:bg-surface-2 group transition-colors"
              >
                <div className={cn("w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-[0.86rem] font-medium text-text-main">{item.label}</div>
                  <div className="text-[0.75rem] text-text-dim group-hover:text-text-muted transition-colors">{item.desc}</div>
                </div>
              </a>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
