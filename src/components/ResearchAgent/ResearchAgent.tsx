import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Target, 
  ListTodo, 
  Activity, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Circle, 
  Loader2,
  Sparkles,
  Search,
  FileText,
  BrainCircuit,
  History,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
}

interface Mission {
  id: string;
  goal: string;
  status: 'idle' | 'active' | 'completed';
  tasks: Task[];
  startTime?: string;
}

export function ResearchAgent() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  const startMission = async () => {
    if (!goalInput.trim()) return;
    
    setIsPlanning(true);
    // Simulate AI planning
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newMission: Mission = {
      id: Math.random().toString(36).substr(2, 9),
      goal: goalInput,
      status: 'active',
      startTime: new Date().toISOString(),
      tasks: [
        { id: '1', title: 'Analyze existing sources for key themes', status: 'pending', progress: 0, logs: [] },
        { id: '2', title: 'Identify knowledge gaps and research questions', status: 'pending', progress: 0, logs: [] },
        { id: '3', title: 'Synthesize findings into a structured report', status: 'pending', progress: 0, logs: [] },
        { id: '4', title: 'Validate conclusions against source data', status: 'pending', progress: 0, logs: [] },
      ]
    };
    
    setMission(newMission);
    setIsPlanning(false);
    setGoalInput('');
    
    // Start the first task
    runTask(newMission.id, '1');
  };

  const runTask = async (missionId: string, taskId: string) => {
    setMission(prev => {
      if (!prev || prev.id !== missionId) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: 'running' as const, progress: 10 } : t)
      };
    });

    // Simulate task progress
    for (let i = 20; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMission(prev => {
        if (!prev || prev.id !== missionId) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? { 
            ...t, 
            progress: i,
            logs: [...t.logs, `Processing chunk ${i/20}...`, `Extracted ${Math.floor(Math.random() * 10)} insights.`]
          } : t)
        };
      });
    }

    setMission(prev => {
      if (!prev || prev.id !== missionId) return prev;
      const updatedTasks = prev.tasks.map(t => t.id === taskId ? { ...t, status: 'completed' as const, progress: 100 } : t);
      
      // Find next task
      const nextTask = updatedTasks.find(t => t.status === 'pending');
      if (nextTask) {
        setTimeout(() => runTask(missionId, nextTask.id), 1000);
      } else {
        return { ...prev, tasks: updatedTasks, status: 'completed' as const };
      }
      
      return { ...prev, tasks: updatedTasks };
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f7] p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#2e2e2e] rounded-[20px] flex items-center justify-center text-white shadow-xl">
              <Bot size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold">Research Agent</h1>
              <p className="text-[#888] font-medium uppercase tracking-widest text-xs">Autonomous Intelligence Partner</p>
            </div>
          </div>
          {mission && (
            <button 
              onClick={() => setMission(null)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e5e0] rounded-xl text-sm font-bold text-[#666] hover:border-red-200 hover:text-red-500 transition-all"
            >
              <RotateCcw size={16} /> Reset Agent
            </button>
          )}
        </header>

        {!mission ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#e8e5e0] rounded-[40px] p-12 shadow-2xl shadow-black/5"
          >
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <Target size={48} className="mx-auto text-[#9a7a52]" />
                <h2 className="text-2xl font-serif font-bold">Define Research Goal</h2>
                <p className="text-[#666]">Set an autonomous mission for the Noteflow Agent. It will break down the goal, analyze sources, and synthesize findings independently.</p>
              </div>

              <div className="relative">
                <textarea 
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g., Analyze the impact of sustainable energy policies on manufacturing costs in the EU from 2019-2021..."
                  className="w-full h-40 px-6 py-5 bg-[#f9f8f6] border border-[#e8e5e0] rounded-3xl text-lg focus:outline-none focus:border-[#9a7a52] transition-all resize-none"
                />
                <button 
                  onClick={startMission}
                  disabled={!goalInput.trim() || isPlanning}
                  className="absolute bottom-4 right-4 px-8 py-3 bg-[#9a7a52] text-white rounded-2xl font-bold hover:bg-[#866944] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {isPlanning ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                  <span>{isPlanning ? 'Planning Mission...' : 'Launch Agent'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  'Summarize competitive landscape',
                  'Identify emerging tech trends',
                  'Analyze regulatory changes',
                  'Synthesize market research'
                ].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setGoalInput(suggestion)}
                    className="p-4 bg-[#f9f8f6] border border-[#e8e5e0] rounded-2xl text-sm font-bold text-[#666] hover:border-[#9a7a52] hover:text-[#9a7a52] transition-all text-left flex items-center justify-between group"
                  >
                    <span>{suggestion}</span>
                    <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white border border-[#e8e5e0] rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <ListTodo size={24} className="text-[#9a7a52]" />
                    <h3 className="text-xl font-serif font-bold">Mission Roadmap</h3>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
                    mission.status === 'active' ? "bg-blue-50 text-blue-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {mission.status}
                  </div>
                </div>

                <div className="space-y-6">
                  {mission.tasks.map((task, idx) => (
                    <div key={task.id} className="relative">
                      {idx !== mission.tasks.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-[#e8e5e0]" />
                      )}
                      <div className="flex gap-6">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                          task.status === 'completed' ? "bg-emerald-500 text-white" :
                          task.status === 'running' ? "bg-blue-500 text-white shadow-lg shadow-blue-200" :
                          "bg-[#f2f0ec] text-[#aaa]"
                        )}>
                          {task.status === 'completed' ? <CheckCircle2 size={18} /> :
                           task.status === 'running' ? <Loader2 size={18} className="animate-spin" /> :
                           <Circle size={18} />}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={cn(
                              "font-bold transition-colors",
                              task.status === 'completed' ? "text-[#1a1a1a]" :
                              task.status === 'running' ? "text-blue-600" : "text-[#aaa]"
                            )}>
                              {task.title}
                            </h4>
                            <span className="text-xs font-bold text-[#aaa]">{task.progress}%</span>
                          </div>
                          {task.status === 'running' && (
                            <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden mb-4">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress}%` }}
                                className="h-full bg-blue-500"
                              />
                            </div>
                          )}
                          {task.logs.length > 0 && (
                            <div className="bg-[#f9f8f6] rounded-xl p-4 space-y-2">
                              {task.logs.slice(-3).map((log, i) => (
                                <p key={i} className="text-xs text-[#888] font-mono flex items-center gap-2">
                                  <ChevronRight size={10} /> {log}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-[#2e2e2e] text-white rounded-[32px] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <Activity size={24} className="text-blue-400" />
                  <h3 className="text-xl font-serif font-bold">Live Activity</h3>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[0.7rem] font-bold text-blue-400 uppercase tracking-widest mb-2">Current Goal</p>
                    <p className="text-sm leading-relaxed text-white/80">{mission.goal}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[0.7rem] font-bold text-white/40 uppercase tracking-widest mb-1">Runtime</p>
                      <p className="text-lg font-bold">04:12</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[0.7rem] font-bold text-white/40 uppercase tracking-widest mb-1">Insights</p>
                      <p className="text-lg font-bold">24</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-[#e8e5e0] rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <BrainCircuit size={24} className="text-[#9a7a52]" />
                  <h3 className="text-xl font-serif font-bold">Adaptive Strategy</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <Sparkles size={16} className="text-emerald-500 mt-0.5" />
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Detected high correlation between policy shifts and energy spikes. Adjusting analysis focus.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Search size={16} className="text-blue-500 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Expanding search to include regional manufacturing reports for better granularity.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
