import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Plus, Globe, Image as ImageIcon, Mic, AudioLines, FileText, Link as LinkIcon, Type, Trash2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'ai';
  content: string;
  file?: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi there! I am Swahivo. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeModal, setActiveModal] = useState<'link' | 'text' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [textBlockInput, setTextBlockInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

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

  const handleSend = async (customContent?: string, customFile?: File) => {
    const content = customContent || input;
    const file = customFile || selectedFile;

    if (!content.trim() && !file) return;

    const userMsg = content.trim() || (file ? `Uploaded ${file.name}` : "");
    setInput('');
    setSelectedFile(null);
    setMessages(prev => [...prev, { role: 'user', content: userMsg, file: file?.name }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Connecting Gemini Embedding 2 for context analysis
      if (content.trim()) {
        try {
          await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: [content],
          });
          console.log("Gemini Embedding 2: Content embedded successfully for context analysis.");
        } catch (embedError) {
          console.warn("Embedding failed, continuing with chat:", embedError);
        }
      }

      const parts: any[] = [];
      if (file) {
        parts.push(await fileToGenerativePart(file));
      }
      if (content.trim()) {
        parts.push({ text: content });
      } else if (file) {
        parts.push({ text: "Analyze this file" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
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
        className="flex flex-col gap-6 mb-4 max-h-[40vh] overflow-y-auto px-4 scrollbar-none"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={`msg-${idx}`}
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
                <div className="flex flex-col gap-2">
                  <div className="prose prose-invert prose-sm max-w-none text-text-main">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.file && (
                    <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-black/20 rounded-lg text-xs border border-white/5">
                      <FileText size={14} className="text-blue-400" />
                      <span className="truncate max-w-[150px]">{msg.file}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 p-4">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                S
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <div className="flex items-center gap-2 text-text-dim text-[0.7rem] animate-pulse">
                  <Sparkles size={12} className="text-accent" />
                  <span>Gemini is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative w-full px-4">
        {selectedFile && (
          <div className="absolute bottom-full left-4 mb-4 z-10 flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-subtle rounded-xl text-xs text-text-main animate-in fade-in slide-in-from-bottom-2">
            <FileText size={14} className="text-blue-400" />
            <span className="truncate max-w-[150px] font-medium">{selectedFile.name}</span>
            <button 
              onClick={() => setSelectedFile(null)}
              className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {/* Plus Menu */}
        <AnimatePresence>
          {isPlusMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-4 mb-4 z-50 bg-surface border border-border-subtle rounded-2xl shadow-2xl p-1.5 min-w-[170px]"
              >
                <button 
                  onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                >
                  <FileText size={16} className="text-blue-400" />
                  <span>Upload PDF</span>
                </button>
                <button 
                  onClick={() => { imageInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                >
                  <ImageIcon size={16} className="text-green-400" />
                  <span>Image upload</span>
                </button>
                <button 
                  onClick={() => { setIsRecording(true); setIsPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                >
                  <Mic size={16} className="text-red-400" />
                  <span>Voice input</span>
                </button>
                <button 
                  onClick={() => { setActiveModal('link'); setIsPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                >
                  <LinkIcon size={16} className="text-purple-400" />
                  <span>Paste link</span>
                </button>
                <button 
                  onClick={() => { setActiveModal('text'); setIsPlusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[0.82rem] text-text-muted hover:bg-white/5 hover:text-text-main rounded-xl transition-colors"
                >
                  <Type size={16} className="text-yellow-400" />
                  <span>Add text block</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="bg-surface rounded-full p-2 flex items-center gap-3 shadow-lg border border-border-subtle focus-within:border-border-muted transition-all">
          <button 
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className={cn(
              "p-2 text-text-dim hover:text-text-main transition-all",
              isPlusMenuOpen && "rotate-45 text-text-main"
            )}
          >
            <Plus size={22} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask anything"
            className="flex-1 bg-transparent border-none outline-none text-text-main text-[1.1rem] px-2 py-2 placeholder:text-text-dim"
          />
          
          <div className="flex items-center gap-2 pr-1">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[0.95rem] font-medium border border-border-subtle",
                isRecording ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" : "bg-surface-2 text-text-main hover:bg-surface-3"
              )}
            >
              <AudioLines size={18} />
              <span>Voice</span>
            </button>
            {(input.trim() || selectedFile) && (
              <button 
                onClick={() => handleSend()}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all active:scale-95"
              >
                <Send size={18} fill="currentColor" />
              </button>
            )}
          </div>
        </div>

        {/* Hidden Inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".pdf" 
          className="hidden" 
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 text-text-dim hover:text-text-main hover:bg-white/5 rounded-full transition-all"
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
                      <h3 className="text-xl font-semibold">Paste Link</h3>
                      <p className="text-sm text-text-dim">Analyze content from a URL</p>
                    </div>
                  </div>
                  <input 
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-400/50 transition-all"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (linkInput) {
                        handleSend(`Analyze this link: ${linkInput}`);
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
                      <h3 className="text-xl font-semibold">Add Text Block</h3>
                      <p className="text-sm text-text-dim">Paste a large snippet of text</p>
                    </div>
                  </div>
                  <textarea 
                    value={textBlockInput}
                    onChange={(e) => setTextBlockInput(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-yellow-400/50 transition-all resize-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (textBlockInput) {
                        handleSend(textBlockInput);
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
