import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Paperclip, Globe, Image as ImageIcon, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
      });
      
      const aiResponse = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl z-10 flex flex-col">
      <div 
        ref={scrollRef}
        className="flex flex-col gap-6 mb-4 max-h-[50vh] overflow-y-auto px-4 scrollbar-none"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex gap-4 p-4 rounded-2xl max-w-[85%]",
                msg.role === 'user' ? "bg-surface-2" : "bg-transparent"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === 'ai' ? "bg-white text-black font-bold" : "bg-surface-3 text-text-muted"
                )}>
                  {msg.role === 'ai' ? "S" : <User size={16} />}
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-text-main">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 p-4">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                S
              </div>
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative w-full px-4">
        <div className="bg-surface rounded-[26px] p-3 flex flex-col gap-2 shadow-lg border border-border-subtle focus-within:border-border-muted transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask anything"
            className="w-full bg-transparent border-none outline-none text-text-main text-[1.1rem] resize-none max-h-40 min-h-[2.5rem] px-3 py-2 placeholder:text-text-dim"
            rows={1}
          />
          
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-text-main hover:bg-surface-2 transition-colors text-[0.85rem] font-medium border border-border-subtle">
                <Paperclip size={16} />
                <span>Attach</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-text-main hover:bg-surface-2 transition-colors text-[0.85rem] font-medium border border-border-subtle">
                <Globe size={16} />
                <span>Search</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-text-main hover:bg-surface-2 transition-colors text-[0.85rem] font-medium border border-border-subtle">
                <ImageIcon size={16} />
                <span>Create image</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-text-main hover:bg-surface-2 transition-colors text-[0.85rem] font-medium border border-border-subtle">
                <Mic size={16} />
                <span>Voice</span>
              </button>
              {input.trim() && (
                <button 
                  onClick={handleSend}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all active:scale-95"
                >
                  <Send size={16} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
