import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, Legend
} from "recharts";
import { 
  FileText, 
  Database, 
  LayoutDashboard, 
  Upload, 
  RefreshCw, 
  Share2, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Filter,
  Grid3X3,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  MoreHorizontal,
  Plus,
  Settings,
  HelpCircle,
  Maximize2,
  Download,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DataIntelligenceProps {
  user: any;
  onBack: () => void;
}

export function DataIntelligence({ user, onBack }: DataIntelligenceProps) {
  const [data, setData] = useState<any[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "table">("bar");
  const [charts, setCharts] = useState<any[]>([]);
  const [view, setView] = useState<"report" | "data" | "model">("report");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload CSV
  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await fetch("/api/data-intelligence/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      setData(result);
      if (result.length > 0) {
        setFields(Object.keys(result[0]));
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const addChart = () => {
    if (!xField || !yField) return;
    setCharts([...charts, { id: Date.now(), chartType, xField, yField }]);
  };

  const removeChart = (id: number) => {
    setCharts(charts.filter(c => c.id !== id));
  };

  const renderChart = (c: any) => {
    const commonProps = {
      width: "100%",
      height: 300,
      data: data,
    };

    switch (c.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey={c.xField} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey={c.yField} fill="#f2c811" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey={c.xField} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey={c.yField} stroke="#f2c811" strokeWidth={2} dot={{ r: 4, fill: '#f2c811' }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={data} 
                dataKey={c.yField} 
                nameKey={c.xField} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                fill="#f2c811"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#f2c811', '#333', '#666', '#999'][index % 4]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const filteredFields = fields.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-main-bg text-text-main overflow-hidden font-sans rounded-[40px] border border-white/5 shadow-2xl">
      
      {/* HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <BarChart3 size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Data Intelligence</h1>
            <p className="text-[10px] text-text-dim uppercase tracking-widest font-semibold">Advanced Analytics Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all group"
            >
              <Upload size={14} className="text-accent group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-text-main uppercase tracking-wider">Get Data</span>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={uploadFile} />
            </button>
            <button 
              onClick={addChart}
              disabled={!xField || !yField || data.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all group disabled:opacity-30"
            >
              <Plus size={14} className="text-accent group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-text-main uppercase tracking-wider">New Visual</span>
            </button>
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 text-xs font-bold text-text-dim hover:text-white transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (VIEWS) */}
        <div className="w-16 bg-surface/30 border-r border-white/5 flex flex-col items-center py-6 gap-6 shrink-0">
          <button 
            onClick={() => setView("report")}
            className={cn(
              "p-3 rounded-xl transition-all", 
              view === "report" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-text-dim hover:bg-white/5 hover:text-text-main"
            )}
            title="Report view"
          >
            <LayoutDashboard size={20} />
          </button>
          <button 
            onClick={() => setView("data")}
            className={cn(
              "p-3 rounded-xl transition-all", 
              view === "data" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-text-dim hover:bg-white/5 hover:text-text-main"
            )}
            title="Data view"
          >
            <Grid3X3 size={20} />
          </button>
          <button 
            onClick={() => setView("model")}
            className={cn(
              "p-3 rounded-xl transition-all", 
              view === "model" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-text-dim hover:bg-white/5 hover:text-text-main"
            )}
            title="Model view"
          >
            <Database size={20} />
          </button>
        </div>

        {/* MAIN CANVAS AREA */}
        <div className="flex-1 bg-main-bg p-6 overflow-auto relative custom-scrollbar">
          
          {/* REPORT VIEW */}
          {view === "report" && (
            <div className="min-h-full flex flex-wrap gap-6 content-start">
              {charts.length === 0 && (
                <div className="w-full h-[400px] flex flex-col items-center justify-center text-text-dim border-2 border-dashed border-white/5 rounded-[32px] bg-surface/20">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 size={40} className="opacity-40" />
                  </div>
                  <h3 className="text-lg font-bold text-text-main">Build visuals with your data</h3>
                  <p className="text-sm opacity-60">Select or drag fields from the Fields pane onto the report canvas.</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 px-6 py-2 bg-accent text-black rounded-xl text-sm font-bold hover:bg-accent/90 transition-all"
                  >
                    Get Data
                  </button>
                </div>
              )}
              {charts.map((c) => (
                <div key={c.id} className="bg-surface/40 border border-white/5 rounded-[32px] p-6 w-full lg:w-[calc(50%-0.75rem)] shadow-xl hover:bg-surface/60 transition-all relative group">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-bold text-text-dim uppercase tracking-widest">
                      {c.yField} by {c.xField}
                    </h4>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/5 rounded-lg text-text-dim hover:text-text-main"><Maximize2 size={14} /></button>
                      <button onClick={() => removeChart(c.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    {renderChart(c)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DATA VIEW */}
          {view === "data" && (
            <div className="h-full bg-surface/40 border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-xl">
              <div className="p-6 border-b border-white/5 bg-surface/20 flex items-center justify-between">
                <span className="text-sm font-bold text-text-main">{data.length} rows loaded</span>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-lg text-text-dim hover:text-text-main"><Download size={18} /></button>
                  <button className="p-2 hover:bg-white/5 rounded-lg text-text-dim hover:text-text-main"><Filter size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr>
                      {fields.map((f) => (
                        <th key={f} className="px-6 py-4 text-left font-bold text-text-dim border-b border-white/5 border-r border-white/5 min-w-[150px] uppercase tracking-widest text-[10px]">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                        {fields.map((f) => (
                          <td key={f} className="px-6 py-4 text-text-main border-r border-white/5 truncate max-w-[300px]">
                            {row[f]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODEL VIEW */}
          {view === "model" && (
            <div className="h-full bg-surface/40 border border-white/5 rounded-[32px] p-8 flex items-center justify-center shadow-xl">
              <div className="text-center space-y-4">
                <Database size={64} className="mx-auto text-accent opacity-20" />
                <h3 className="text-xl font-bold text-text-main">Model Relationships</h3>
                <p className="text-text-dim max-w-md mx-auto">Manage relationships between different data tables to build complex reports.</p>
                <div className="flex justify-center gap-6 mt-12">
                  <div className="w-40 h-52 bg-white/5 border border-white/10 rounded-2xl p-4 text-left shadow-2xl">
                    <div className="h-2 w-20 bg-accent rounded-full mb-6" />
                    <div className="space-y-3">
                      <div className="h-1.5 w-full bg-white/10 rounded-full" />
                      <div className="h-1.5 w-full bg-white/10 rounded-full" />
                      <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center text-accent opacity-40">
                    <ChevronRight size={24} />
                  </div>
                  <div className="w-40 h-52 bg-white/5 border border-white/10 rounded-2xl p-4 text-left shadow-2xl">
                    <div className="h-2 w-20 bg-green-500 rounded-full mb-6" />
                    <div className="space-y-3">
                      <div className="h-1.5 w-full bg-white/10 rounded-full" />
                      <div className="h-1.5 w-full bg-white/10 rounded-full" />
                      <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANELS */}
        <div className="w-80 bg-surface/30 border-l border-white/5 flex flex-col shrink-0">
          
          {/* FILTERS PANE */}
          <div className="border-b border-white/5">
            <div className="flex items-center justify-between p-4 bg-surface/20">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-text-dim" />
                <span className="text-xs font-bold text-text-main uppercase tracking-widest">Filters</span>
              </div>
              <ChevronDown size={14} className="text-text-dim" />
            </div>
            <div className="p-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-[11px] text-text-dim italic">
                Add data fields here to filter visuals
              </div>
            </div>
          </div>

          {/* VISUALIZATIONS PANE */}
          <div className="border-b border-white/5">
            <div className="flex items-center justify-between p-4 bg-surface/20">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-text-dim" />
                <span className="text-xs font-bold text-text-main uppercase tracking-widest">Visuals</span>
              </div>
              <ChevronDown size={14} className="text-text-dim" />
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { type: 'bar', icon: <BarChart3 size={16} /> },
                  { type: 'line', icon: <LineChartIcon size={16} /> },
                  { type: 'pie', icon: <PieChartIcon size={16} /> },
                  { type: 'table', icon: <TableIcon size={16} /> },
                ].map((v) => (
                  <button 
                    key={v.type}
                    onClick={() => setChartType(v.type as any)}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-xl border transition-all",
                      chartType === v.type ? "bg-accent border-accent text-black shadow-lg shadow-accent/20" : "bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:text-text-main"
                    )}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">X-Axis / Category</label>
                  <select 
                    value={xField}
                    onChange={(e) => setXField(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-accent transition-all text-text-main"
                  >
                    <option value="" className="bg-surface">Select Field</option>
                    {fields.map(f => <option key={f} value={f} className="bg-surface">{f}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Y-Axis / Values</label>
                  <select 
                    value={yField}
                    onChange={(e) => setYField(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-accent transition-all text-text-main"
                  >
                    <option value="" className="bg-surface">Select Field</option>
                    {fields.map(f => <option key={f} value={f} className="bg-surface">{f}</option>)}
                  </select>
                </div>
                <button 
                  onClick={addChart}
                  disabled={!xField || !yField || data.length === 0}
                  className="w-full py-3 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent/10"
                >
                  Add to Report
                </button>
              </div>
            </div>
          </div>

          {/* FIELDS PANE */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface/20">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-text-dim" />
                <span className="text-xs font-bold text-text-main uppercase tracking-widest">Fields</span>
              </div>
              <ChevronDown size={14} className="text-text-dim" />
            </div>
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <input 
                  type="text" 
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-accent transition-all text-text-main"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {data.length === 0 ? (
                <div className="p-8 text-center">
                  <TableIcon size={32} className="mx-auto text-white/5 mb-4" />
                  <p className="text-xs text-text-dim">No data loaded. <button onClick={() => fileInputRef.current?.click()} className="text-accent hover:underline">Get data</button></p>
                </div>
              ) : (
                filteredFields.map(f => (
                  <div key={f} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-white/5">
                    <div className="w-5 h-5 bg-white/5 rounded-lg flex items-center justify-center text-[10px] font-bold text-accent">
                      {typeof data[0][f] === 'number' ? 'Σ' : 'A'}
                    </div>
                    <span className="text-xs text-text-main truncate flex-1">{f}</span>
                    <MoreHorizontal size={14} className="text-text-dim opacity-0 group-hover:opacity-100" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER / STATUS BAR */}
      <footer className="h-10 bg-black border-t border-white/5 px-6 py-1 flex items-center justify-between text-[10px] text-text-dim shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="font-bold uppercase tracking-widest">Connected</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="font-bold uppercase tracking-widest">Page 1 of 1</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button className="hover:text-text-main transition-colors"><HelpCircle size={14} /></button>
            <button className="hover:text-text-main transition-colors"><Settings size={14} /></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
