import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Info,
  Maximize2,
  Settings,
  Activity,
  Eye,
  Video,
  ShieldAlert,
  Gavel,
  Database,
  Youtube,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface VARProps {
  user: any;
  onBack: () => void;
}

const FOUL_SAMPLES = [
  {
    id: 1,
    label: "Fine-grained foul classification",
    description: "Classifying the foul into one of 8 fine-grained foul classes: Standing tackling, High leg, Pushing, Holding, Elbowing, Challenge, Dive/Simulation.",
    page: 5,
    severity: "Medium"
  },
  {
    id: 2,
    label: "Offence severity classification",
    description: "Classifying whether the foul constitutes an offence: No offence, Offence + No card, Offence + Yellow card, and Offence + Red card.",
    page: 5,
    severity: "High"
  },
  {
    id: 3,
    label: "Multi-view Dataset Analysis",
    description: "SoccerNet-MVFouls: 3,901 actions with multi-view clips of 5 seconds around the action, annotated by professional referees.",
    page: 2,
    severity: "Low"
  }
];

export function VAR({ user, onBack }: VARProps) {
  const [selectedSample, setSelectedSample] = useState(FOUL_SAMPLES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeView, setActiveView] = useState<'live' | 'replay1' | 'replay2'>('live');
  const [poolingStrategy, setPoolingStrategy] = useState<'mean' | 'max'>('max');
  const [isMTLEnabled, setIsMTLEnabled] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'deep'>('deep');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [activeYoutubeId, setActiveYoutubeId] = useState<string | null>(null);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    if (match && match[2].length === 11) {
      setActiveYoutubeId(match[2]);
      setShowYoutubeInput(false);
    } else {
      alert('Invalid YouTube URL');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg text-text-main overflow-hidden font-sans rounded-[40px] border border-border-muted shadow-2xl">
      {/* Header */}
      <header className="h-16 border-b border-border-muted flex items-center justify-between px-6 bg-surface/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Video size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">VARS</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Video Assistant Referee System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-full border border-red-500/20 transition-all group"
          >
            <Youtube size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Test YouTube Feed</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-full border border-border-muted">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-text-muted tracking-wide uppercase">System Active</span>
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Analysis Queue */}
        <div className="w-80 border-r border-border-muted bg-surface/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-border-muted">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Analysis Queue</h2>
            <div className="space-y-2">
              {FOUL_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => setSelectedSample(sample)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                    selectedSample.id === sample.id 
                      ? "bg-surface-2 border-accent text-text-main shadow-lg shadow-accent/5" 
                      : "bg-surface-2 border-transparent text-text-muted hover:bg-surface-3 hover:text-text-main"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      sample.severity === 'High' ? "bg-red-500/20 text-red-400" :
                      sample.severity === 'Medium' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    )}>
                      {sample.severity} Priority
                    </span>
                    <span className="text-[10px] opacity-40">ID: #{sample.id}429</span>
                  </div>
                  <h3 className="text-sm font-bold mb-1 group-hover:text-text-main transition-colors">{sample.label}</h3>
                  <p className="text-[11px] opacity-50 line-clamp-2 leading-relaxed">{sample.description}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">System Metrics</h2>
            <div className="space-y-4">
              <div className="bg-surface-2 p-4 rounded-xl border border-border-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Detection Accuracy</span>
                  <span className="text-xs font-bold text-accent">94.2%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '94.2%' }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
              <div className="bg-surface-2 p-4 rounded-xl border border-border-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Processing Latency</span>
                  <span className="text-xs font-bold text-green-400">12ms</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '12%' }}
                    className="h-full bg-green-400"
                  />
                </div>
              </div>

              {/* Pooling Strategy Toggle */}
              <div className="bg-surface-2 p-4 rounded-xl border border-border-muted">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Aggregation</span>
                  <div className="flex bg-surface-3 p-1 rounded-lg border border-border-muted">
                    <button 
                      onClick={() => setPoolingStrategy('mean')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        poolingStrategy === 'mean' ? "bg-accent text-white shadow-lg" : "text-text-muted hover:text-text-main"
                      )}
                    >
                      Mean
                    </button>
                    <button 
                      onClick={() => setPoolingStrategy('max')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        poolingStrategy === 'max' ? "bg-accent text-white shadow-lg" : "text-text-muted hover:text-text-main"
                      )}
                    >
                      Max
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  {poolingStrategy === 'max' 
                    ? "Max pooling identifies the most important features from informative views." 
                    : "Mean pooling provides a balanced spatio-temporal representation."}
                </p>
              </div>

              {/* Multi-Task Learning Toggle */}
              <div className="bg-surface-2 p-4 rounded-xl border border-border-muted">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-main font-bold">Multi-Task Learning</span>
                    <span className="text-[9px] text-text-muted uppercase tracking-widest">Shared Feature Extraction</span>
                  </div>
                  <button 
                    onClick={() => setIsMTLEnabled(!isMTLEnabled)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      isMTLEnabled ? "bg-accent" : "bg-surface-3"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                      isMTLEnabled ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              {/* Analysis Depth Toggle */}
              <div className="bg-surface-2 p-4 rounded-xl border border-border-muted">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Analysis Depth</span>
                  <div className="flex bg-surface-3 p-1 rounded-lg border border-border-muted">
                    <button 
                      onClick={() => setAnalysisDepth('standard')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        analysisDepth === 'standard' ? "bg-accent text-white shadow-lg" : "text-text-muted hover:text-text-main"
                      )}
                    >
                      Std
                    </button>
                    <button 
                      onClick={() => setAnalysisDepth('deep')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        analysisDepth === 'deep' ? "bg-accent text-white shadow-lg" : "text-text-muted hover:text-text-main"
                      )}
                    >
                      Deep
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Video Feed */}
        <div className="flex-1 flex flex-col bg-black relative">
          {/* YouTube Input Overlay */}
          <AnimatePresence>
            {showYoutubeInput && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md"
              >
                <form onSubmit={handleYoutubeSubmit} className="bg-surface border border-white/10 p-4 rounded-2xl shadow-2xl flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input 
                      type="text" 
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Paste YouTube URL..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-accent transition-all text-white"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent/90 transition-all"
                  >
                    Load
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowYoutubeInput(false)}
                    className="p-2 text-text-dim hover:text-white transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Viewport */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {/* Simulated Video Feed */}
            <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center relative">
              {activeYoutubeId ? (
                <div className="w-full h-full relative">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${activeYoutubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="absolute inset-0"
                  />
                  <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
                  <button 
                    onClick={() => setActiveYoutubeId(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black rounded-full text-white transition-all"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)]" />
                    <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                  </div>
                  
                  <div className="text-center space-y-6 z-10">
                    <div className="relative inline-block">
                      <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full animate-pulse" />
                      <Video size={80} className="text-accent relative" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight mb-2">Multi-View Feed: {activeView.toUpperCase()}</h3>
                      <p className="text-text-dim text-sm max-w-md mx-auto">
                        Analyzing spatio-temporal features using MVIT for fine-grained foul classification.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Overlay UI */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="px-3 py-1.5 bg-accent text-black text-[10px] font-black uppercase tracking-[0.2em] rounded shadow-xl">
                  Live Analysis
                </div>
                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-bold uppercase tracking-widest rounded border border-white/10">
                  Cam: 0{activeView === 'live' ? '1' : activeView === 'replay1' ? '2' : '3'}
                </div>
              </div>

              <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                  <Activity size={12} className="text-accent" />
                  <span className="text-[10px] font-mono text-accent">REC 00:04:29:12</span>
                </div>
              </div>

              {/* View Selector Overlay */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
                {(['live', 'replay1', 'replay2'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveView(v)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      activeView === v 
                        ? "bg-white text-black shadow-xl" 
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="h-20 bg-surface border-t border-white/5 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-6">
              <button className="p-2 text-text-dim hover:text-white transition-colors">
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim">
                  <span>00:02:14</span>
                  <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-1/3" />
                  </div>
                  <span>00:05:00</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-text-dim hover:text-white transition-colors">
                <Maximize2 size={20} />
              </button>
              <button className="p-2 text-text-dim hover:text-white transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Decision Panel */}
        <div className="w-96 border-l border-white/5 bg-surface/30 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-6">Decision Support</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1">Foul Detected</h4>
                  <p className="text-xs text-text-dim leading-relaxed">High-probability offence in the 18-yard box.</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim font-medium">Classification</span>
                  <span className="text-xs font-bold text-accent">Standing Tackling</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim font-medium">Confidence</span>
                  <span className="text-xs font-bold text-green-400">
                    {poolingStrategy === 'max' ? (isMTLEnabled ? '95.4%' : '91.2%') : (isMTLEnabled ? '92.1%' : '88.5%')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim font-medium">Severity</span>
                  <span className="text-xs font-bold text-yellow-400">Yellow Card</span>
                </div>
              </div>

              {/* Subtle Cue Analysis */}
              <AnimatePresence>
                {analysisDepth === 'deep' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Subtle Cue Analysis</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-text-dim uppercase block mb-1">Point of Contact</span>
                        <span className="text-xs font-bold text-red-400">Ankle/Lower</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-text-dim uppercase block mb-1">Relative Speed</span>
                        <span className="text-xs font-bold text-white">8.4 m/s</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-text-dim uppercase block mb-1">Player Intention</span>
                        <span className="text-xs font-bold text-yellow-400">Disregard</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-text-dim uppercase block mb-1">Field Position</span>
                        <span className="text-xs font-bold text-white">Defensive 3rd</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500/20 transition-all group">
                  <CheckCircle2 size={24} className="text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Confirm</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all group">
                  <XCircle size={24} className="text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400">No Offence</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4">Paper Reference</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Gavel size={14} className="text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-main">VARS Methodology</span>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed italic">
                  "VARS leverages the latest findings in multi-view video analysis for real-time feedback."
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={14} className="text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-main">Dataset Insights</span>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed italic">
                  "SoccerNet-MVFoul: Annotated by professional soccer referees."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <footer className="h-10 bg-black border-t border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Server: EU-WEST-1</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-white/20" />
            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Bandwidth: 1.2 GB/s</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">© 2024 VARS INTELLIGENCE</span>
        </div>
      </footer>
    </div>
  );
}
