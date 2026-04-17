import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Plus, 
  Settings, 
  MessageSquare, 
  Database, 
  Globe, 
  Code, 
  Trash2, 
  ChevronRight, 
  X, 
  Search,
  Sparkles,
  Zap,
  Shield,
  Users,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  User,
  FileText,
  Type,
  Send,
  Image,
  BarChart3,
  Cpu,
  Link as LinkIcon,
  MessageCircle,
  PlusCircle,
  MoreHorizontal,
  ChevronLeft,
  Loader2,
  Smile,
  Paperclip,
  Share2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { User as UserType } from '../../types';

interface Chatbot {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  model: string;
  channels?: {
    [key: string]: { status: 'connected' | 'disconnected' };
  };
}

interface AIChatbotsProps {
  user: UserType;
  onBack?: () => void;
}

export function AIChatbots({ user, onBack }: AIChatbotsProps) {
  const [chatbots, setChatbots] = useState<Chatbot[]>([
    {
      id: '1',
      name: 'Customer Support Bot',
      description: 'Handles general inquiries and support tickets.',
      status: 'active',
      created_at: '2024-03-20',
      model: 'Gemini 1.5 Pro',
      channels: {
        whatsapp: { status: 'connected' },
        telegram: { status: 'disconnected' }
      }
    },
    {
      id: '2',
      name: 'Sales Assistant',
      description: 'Qualifies leads and schedules demos.',
      status: 'draft',
      created_at: '2024-03-22',
      model: 'Gemini 1.5 Flash',
      channels: {
        messenger: { status: 'disconnected' }
      }
    }
  ]);

  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isTestChatOpen, setIsTestChatOpen] = useState(false);
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [testInput, setTestInput] = useState('');

  const handleUpdateChatbot = (updates: Partial<Chatbot>) => {
    if (!selectedChatbot) return;
    const updated = { ...selectedChatbot, ...updates };
    setSelectedChatbot(updated);
    setChatbots(prev => prev.map(bot => bot.id === updated.id ? updated : bot));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-4 mb-10">
      {[1, 2, 3, 4, 5].map((step) => (
        <React.Fragment key={step}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
            activeStep === step 
              ? "bg-accent border-accent text-black shadow-lg shadow-accent/20" 
              : activeStep > step 
                ? "bg-accent/20 border-accent text-accent" 
                : "bg-surface border-white/5 text-text-dim"
          )}>
            {activeStep > step ? <Check size={16} /> : step}
          </div>
          {step < 5 && <div className={cn("h-0.5 flex-1 rounded-full", activeStep > step ? "bg-accent" : "bg-white/5")} />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderIntegrations = () => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-text-dim uppercase tracking-[0.2em]">Step 5: Channel Integrations</h4>
        <div className="h-px flex-1 mx-6 bg-white/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'text-green-400' },
          { id: 'telegram', name: 'Telegram', icon: Send, color: 'text-blue-400' },
          { id: 'messenger', name: 'Messenger', icon: MessageSquare, color: 'text-blue-500' },
          { id: 'instagram', name: 'Instagram', icon: Image, color: 'text-pink-400' },
          { id: 'webhook', name: 'Webhook', icon: Zap, color: 'text-yellow-400' }
        ].map((channel) => {
          const isConnected = selectedChatbot?.channels?.[channel.id]?.status === 'connected';
          return (
            <div key={channel.id} className="bg-surface border border-white/5 rounded-3xl p-6 space-y-6 hover:border-accent transition-all group shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <channel.icon size={24} className={channel.color} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isConnected ? "text-green-500" : "text-text-dim"
                )}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-text-main">{channel.name}</p>
                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Connect your business account</p>
              </div>
              <button 
                onClick={() => {
                  const newStatus = isConnected ? 'disconnected' : 'connected';
                  const updatedChannels = {
                    ...(selectedChatbot?.channels || {}),
                    [channel.id]: { status: newStatus as any }
                  };
                  handleUpdateChatbot({ channels: updatedChannels });
                }}
                className={cn(
                  "w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  isConnected 
                    ? "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20" 
                    : "bg-accent text-black hover:bg-accent/90 shadow-lg shadow-accent/20"
                )}
              >
                {isConnected ? 'Disconnect' : 'Configure'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="flex h-full bg-main-bg text-text-main overflow-hidden font-sans">
      {/* Sidebar - Bot List */}
      <aside className="w-80 border-r border-white/5 bg-surface/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">My Chatbots</h2>
            <button 
              onClick={() => {
                const newBot: Chatbot = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: 'New Chatbot',
                  description: 'A new AI assistant.',
                  status: 'draft',
                  created_at: new Date().toISOString().split('T')[0],
                  model: 'Gemini 1.5 Pro'
                };
                setChatbots(prev => [newBot, ...prev]);
                setSelectedChatbot(newBot);
                setIsCreating(true);
                setActiveStep(1);
              }}
              className="p-2 bg-accent text-black rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              type="text" 
              placeholder="Search bots..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-accent/50 transition-all text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {chatbots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => {
                setSelectedChatbot(bot);
                setIsCreating(true);
                setActiveStep(1);
              }}
              className={cn(
                "w-full p-4 rounded-2xl flex items-start gap-4 text-left transition-all border",
                selectedChatbot?.id === bot.id 
                  ? "bg-white/5 border-accent shadow-lg shadow-accent/5" 
                  : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
              )}
            >
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                <Bot size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm truncate">{bot.name}</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    bot.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {bot.status}
                  </span>
                </div>
                <p className="text-xs text-text-dim truncate">{bot.description}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isCreating ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-surface rounded-[32px] flex items-center justify-center text-accent shadow-2xl border border-white/5">
                <Bot size={48} />
              </div>
              <div className="max-w-md space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">AI Chatbot Factory</h1>
                <p className="text-text-dim text-lg">Create, train, and deploy intelligent conversational agents across multiple channels in minutes.</p>
              </div>
              <button 
                onClick={() => {
                  const newBot: Chatbot = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Chatbot',
                    description: 'A new AI assistant.',
                    status: 'draft',
                    created_at: new Date().toISOString().split('T')[0],
                    model: 'Gemini 1.5 Pro'
                  };
                  setChatbots(prev => [newBot, ...prev]);
                  setSelectedChatbot(newBot);
                  setIsCreating(true);
                  setActiveStep(1);
                }}
                className="px-8 py-4 bg-accent text-black rounded-2xl font-bold hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 flex items-center gap-3"
              >
                <PlusCircle size={24} />
                Create Your First Bot
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="creating"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <header className="h-20 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="p-2 hover:bg-white/5 rounded-xl text-text-dim transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h3 className="font-bold text-lg">{selectedChatbot?.name}</h3>
                    <p className="text-xs text-text-dim uppercase tracking-widest font-bold">Bot Configuration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsTestChatOpen(!isTestChatOpen)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                      isTestChatOpen ? "bg-accent text-black border-accent" : "bg-white/5 text-text-main border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Zap size={16} />
                    Test Bot
                  </button>
                  <button className="px-6 py-2 bg-accent text-black text-xs font-bold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                    Publish Bot
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  {renderStepIndicator()}

                  <AnimatePresence mode="wait">
                    {activeStep === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">Basic Information</h2>
                          <p className="text-text-dim">Give your bot a name and a clear description of its purpose.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Bot Name</label>
                            <input 
                              type="text"
                              value={selectedChatbot?.name}
                              onChange={(e) => handleUpdateChatbot({ name: e.target.value })}
                              className="w-full bg-surface border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-accent/50 transition-all text-white"
                              placeholder="e.g., Support Hero"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Description</label>
                            <textarea 
                              value={selectedChatbot?.description}
                              onChange={(e) => handleUpdateChatbot({ description: e.target.value })}
                              className="w-full bg-surface border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-accent/50 transition-all text-white h-32 resize-none"
                              placeholder="Describe what this bot does..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => setActiveStep(2)}
                            className="px-8 py-3 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center gap-2"
                          >
                            Next Step
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 5 && (
                      <motion.div 
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                        {renderIntegrations()}
                        <div className="flex justify-between">
                          <button 
                            onClick={() => setActiveStep(4)}
                            className="px-8 py-3 bg-white/5 text-text-main rounded-xl font-bold hover:bg-white/10 transition-all"
                          >
                            Previous
                          </button>
                          <button 
                            onClick={() => setIsCreating(false)}
                            className="px-8 py-3 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all"
                          >
                            Finish Setup
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">Model Selection</h2>
                          <p className="text-text-dim">Choose the AI engine that will power your chatbot's intelligence.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Most capable model for complex reasoning and large contexts.', icon: Cpu, color: 'text-purple-400' },
                            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Fast and efficient model for high-volume, low-latency tasks.', icon: Zap, color: 'text-yellow-400' },
                            { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', desc: 'Balanced performance for standard conversational tasks.', icon: Bot, color: 'text-blue-400' }
                          ].map((model) => (
                            <button 
                              key={model.id}
                              onClick={() => handleUpdateChatbot({ model: model.name })}
                              className={cn(
                                "p-6 rounded-3xl border text-left transition-all group",
                                selectedChatbot?.model === model.name 
                                  ? "bg-accent/10 border-accent shadow-lg shadow-accent/5" 
                                  : "bg-surface border-white/5 hover:border-white/20"
                              )}
                            >
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <model.icon size={24} className={model.color} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-text-main">{model.name}</h4>
                                  <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Google DeepMind</p>
                                </div>
                                {selectedChatbot?.model === model.name && <Check size={20} className="text-accent" />}
                              </div>
                              <p className="text-xs text-text-dim leading-relaxed">{model.desc}</p>
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between">
                          <button 
                            onClick={() => setActiveStep(1)}
                            className="px-8 py-3 bg-white/5 text-text-main rounded-xl font-bold hover:bg-white/10 transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => setActiveStep(3)}
                            className="px-8 py-3 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center gap-2"
                          >
                            Next Step
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">Knowledge Base</h2>
                          <p className="text-text-dim">Upload documents or provide links to train your bot on your specific data.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-surface border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed hover:border-accent transition-all cursor-pointer group">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-text-dim group-hover:text-accent transition-colors">
                              <FileText size={32} />
                            </div>
                            <div>
                              <h4 className="font-bold">Upload Documents</h4>
                              <p className="text-xs text-text-dim">PDF, DOCX, TXT (Max 50MB)</p>
                            </div>
                          </div>
                          <div className="bg-surface border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed hover:border-accent transition-all cursor-pointer group">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-text-dim group-hover:text-accent transition-colors">
                              <Globe size={32} />
                            </div>
                            <div>
                              <h4 className="font-bold">Crawl Website</h4>
                              <p className="text-xs text-text-dim">Import content from a URL</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Trained Sources</h4>
                          <div className="space-y-2">
                            {[
                              { name: 'Product_Manual_v2.pdf', type: 'pdf', size: '2.4 MB' },
                              { name: 'https://docs.swahivo.ai', type: 'url', size: '42 pages' }
                            ].map((source, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-3">
                                  {source.type === 'pdf' ? <FileText size={16} className="text-red-400" /> : <Globe size={16} className="text-blue-400" />}
                                  <div>
                                    <p className="text-sm font-bold">{source.name}</p>
                                    <p className="text-[10px] text-text-dim">{source.size}</p>
                                  </div>
                                </div>
                                <button className="p-2 text-text-dim hover:text-red-400 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <button 
                            onClick={() => setActiveStep(2)}
                            className="px-8 py-3 bg-white/5 text-text-main rounded-xl font-bold hover:bg-white/10 transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => setActiveStep(4)}
                            className="px-8 py-3 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center gap-2"
                          >
                            Next Step
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 4 && (
                      <motion.div 
                        key="step4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">Behavior & Persona</h2>
                          <p className="text-text-dim">Define how your bot should interact with users.</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-text-dim uppercase tracking-widest">System Prompt</label>
                            <textarea 
                              className="w-full bg-surface border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-accent/50 transition-all text-white h-40 resize-none"
                              placeholder="You are a helpful customer support assistant for Swahivo. Your tone is professional yet friendly..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Tone of Voice</label>
                              <select className="w-full bg-surface border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-accent/50 transition-all text-white">
                                <option>Professional</option>
                                <option>Friendly</option>
                                <option>Technical</option>
                                <option>Casual</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-text-dim uppercase tracking-widest">Creativity (Temperature)</label>
                              <input type="range" className="w-full accent-accent" />
                              <div className="flex justify-between text-[10px] text-text-dim font-bold uppercase">
                                <span>Precise</span>
                                <span>Balanced</span>
                                <span>Creative</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <button 
                            onClick={() => setActiveStep(3)}
                            className="px-8 py-3 bg-white/5 text-text-main rounded-xl font-bold hover:bg-white/10 transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => setActiveStep(5)}
                            className="px-8 py-3 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all flex items-center gap-2"
                          >
                            Next Step
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Placeholder for other steps */}
                    {[].includes(activeStep) && (
                      <motion.div 
                        key={`step${activeStep}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center py-20 text-center space-y-6"
                      >
                        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-accent border border-white/5">
                          <Settings size={32} className="animate-spin-slow" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">Step {activeStep} Configuration</h3>
                          <p className="text-text-dim max-w-sm">This section is being optimized for your bot's specific model and requirements.</p>
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setActiveStep(activeStep - 1)}
                            className="px-6 py-2 bg-white/5 text-text-main rounded-xl font-bold hover:bg-white/10 transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => setActiveStep(activeStep + 1)}
                            className="px-6 py-2 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all"
                          >
                            Continue
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Chat Sidebar */}
        <AnimatePresence>
          {isTestChatOpen && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-[400px] border-l border-white/5 bg-surface flex flex-col shrink-0 shadow-2xl z-50"
            >
              <header className="p-6 border-b border-white/5 flex items-center justify-between bg-surface/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Test: {selectedChatbot?.name}</h4>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTestChatOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-text-dim transition-all"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {testMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <MessageCircle size={40} />
                    <p className="text-xs font-medium">Send a message to start testing your bot's responses.</p>
                  </div>
                )}
                {testMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      msg.role === 'user' ? "bg-accent text-black" : "bg-white/5 border border-white/10 text-text-dim"
                    )}>
                      {msg.role === 'user' ? 'U' : 'B'}
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl text-xs leading-relaxed max-w-[85%]",
                      msg.role === 'user' ? "bg-accent/10 text-white border border-accent/20" : "bg-white/5 text-text-main border border-white/10"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-white/5 bg-surface/80 backdrop-blur-md">
                <div className="relative">
                  <textarea 
                    rows={1}
                    value={testInput}
                    onChange={(e) => {
                      setTestInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && testInput.trim()) {
                        e.preventDefault();
                        setTestMessages(prev => [...prev, { role: 'user', content: testInput }]);
                        setTestInput('');
                        (e.target as HTMLTextAreaElement).style.height = 'auto';
                        // Simulate bot response
                        setTimeout(() => {
                          setTestMessages(prev => [...prev, { role: 'assistant', content: "I'm processing your request. This is a simulated response from your bot's configuration." }]);
                        }, 1000);
                      }
                    }}
                    placeholder="Type a test message..."
                    className="w-full bg-main-bg border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs outline-none focus:border-accent/50 focus:ring-0 transition-all text-white resize-none max-h-40 custom-scrollbar"
                  />
                  <button 
                    onClick={() => {
                      if (testInput.trim()) {
                        setTestMessages(prev => [...prev, { role: 'user', content: testInput }]);
                        setTestInput('');
                        setTimeout(() => {
                          setTestMessages(prev => [...prev, { role: 'assistant', content: "I'm processing your request. This is a simulated response from your bot's configuration." }]);
                        }, 1000);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent hover:text-accent-light transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
