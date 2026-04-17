import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MoreVertical, 
  Check, 
  Plus,
  Send, 
  Paperclip, 
  Smile, 
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Phone,
  Clock,
  Globe,
  Tag,
  Briefcase,
  MapPin,
  Calendar,
  History,
  StickyNote,
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  BarChart3,
  Settings,
  ArrowLeft,
  QrCode,
  Share2,
  UserPlus,
  Filter,
  MoreHorizontal,
  Download,
  PlusCircle,
  Building2,
  PieChart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/src/lib/utils';

interface PowerdeskProps {
  user: any;
  onBack: () => void;
}

const TEAM_MEMBERS = [
  { id: 1, name: 'Chris Evans', role: 'Support Lead', avatar: 'CE' },
  { id: 2, name: 'Sarah Jenkins', role: 'Agent', avatar: 'SJ' },
  { id: 3, name: 'Mike Ross', role: 'Agent', avatar: 'MR' },
];

const REPORTING_DATA = [
  { name: 'Mon', tickets: 12, solved: 10 },
  { name: 'Tue', tickets: 19, solved: 15 },
  { name: 'Wed', tickets: 15, solved: 14 },
  { name: 'Thu', tickets: 22, solved: 18 },
  { name: 'Fri', tickets: 30, solved: 25 },
  { name: 'Sat', tickets: 10, solved: 8 },
  { name: 'Sun', tickets: 8, solved: 7 },
];

const CONVERSATIONS = [
  { id: 1, name: 'Mia', company: 'Dropbox', time: '24 min', snippet: 'Retrieving an important file', avatar: 'M', color: 'bg-blue-600', status: 'pending', assignee: 'Sarah Jenkins' },
  { id: 2, name: 'Naomi', company: 'Unity', time: '41 min', snippet: 'Signing up for a demo account', avatar: 'N', color: 'bg-black', active: true, status: 'open', assignee: 'Chris Evans' },
  { id: 3, name: 'Olivia', company: 'Dropbox', time: '56 min', snippet: 'Enabling access for the marketing manager', avatar: 'O', color: 'bg-red-500', status: 'in-progress', assignee: 'Mike Ross' },
  { id: 4, name: 'William', company: 'DoorDash', time: '1 hour', snippet: 'How to navigate the help centre', avatar: 'W', color: 'bg-gray-700', status: 'solved', assignee: 'Chris Evans' },
];

const MESSAGES = [
  { id: 1, sender: 'Naomi', time: '11:24', content: 'Hi there,\n\nI would like to sign up for a demo account to try out the product. I completed the form on your website and awaiting further instructions. Is there anything else that I need to do?\n\nBest Regards,\nNaomi', type: 'received' },
  { id: 2, sender: 'Chris', time: '11:53', content: 'Hi Naomi 👋\n\nThank you for your interest. I\'ve added you to the waitlist and will be sending you an access key to the private beta in the upcoming few days. Could you please confirm your e-mail?', type: 'sent' },
  { id: 3, sender: 'Naomi', time: '41 min ago', content: 'That\'s perfect, looking forward! My email is: naomi.austin@unity.com.', type: 'received' },
];

export function Powerdesk({ user, onBack }: PowerdeskProps) {
  const [selectedConv, setSelectedConv] = useState(CONVERSATIONS[1]);
  const [messageInput, setMessageInput] = useState('');
  const [activeView, setActiveView] = useState<'tickets' | 'reporting' | 'customers' | 'organizations'>('tickets');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isWhatsAppLinked, setIsWhatsAppLinked] = useState(false);

  const renderTicketsView = () => (
    <div className="flex h-full overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-[#eef0f2] flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Tickets</h2>
            <p className="text-xs text-gray-400">Manage your active conversations</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <Filter size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
            <button 
              onClick={() => setShowWhatsAppModal(true)}
              className={cn(
                "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border",
                isWhatsAppLinked 
                  ? "bg-green-50 text-green-600 border-green-100" 
                  : "bg-black text-white border-black hover:bg-black/90"
              )}
            >
              <QrCode size={16} />
              {isWhatsAppLinked ? "WhatsApp Linked" : "Link WhatsApp via QR"}
            </button>
          </div>

          {CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                "w-full p-4 flex gap-4 text-left transition-all border-l-4",
                selectedConv.id === conv.id 
                  ? "bg-[#1e1e2d] text-white border-white" 
                  : "hover:bg-gray-50 border-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                conv.color,
                selectedConv.id === conv.id ? "text-white" : "text-white"
              )}>
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm truncate">{conv.name}</span>
                  <span className={cn("text-[10px]", selectedConv.id === conv.id ? "text-white/60" : "text-gray-400")}>{conv.time}</span>
                </div>
                <p className={cn("text-xs truncate", selectedConv.id === conv.id ? "text-white/60" : "text-gray-500")}>
                  {conv.snippet}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    conv.status === 'solved' ? "bg-green-500/20 text-green-400" :
                    conv.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    {conv.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Header */}
        <header className="h-16 px-8 border-b border-[#eef0f2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-bold text-sm">{selectedConv.name} • {selectedConv.company}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Ticket #4291</span>
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{selectedConv.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {['open', 'pending', 'in-progress', 'solved'].map((s) => (
                <button
                  key={s}
                  className={cn(
                    "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedConv.status === s ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <button 
              onClick={() => setShowShareModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <Share2 size={18} />
            </button>
            <button className="px-4 py-1.5 bg-[#4c49ed] text-white text-xs font-bold rounded-lg hover:bg-[#3f3ccf] transition-all">
              Mark as Solved
            </button>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#f8f9fb]">
          {MESSAGES.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-4",
              msg.type === 'sent' ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0",
                msg.type === 'sent' ? "bg-blue-500" : "bg-black"
              )}>
                {msg.sender.charAt(0)}
              </div>
              <div className="max-w-2xl space-y-2">
                <div className={cn(
                  "p-6 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.type === 'sent' 
                    ? "bg-white border border-[#eef0f2] text-[#1a1a1a]" 
                    : "bg-white border border-[#eef0f2] text-[#1a1a1a]"
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className={cn(
                  "text-[10px] text-gray-400 font-medium",
                  msg.type === 'sent' ? "text-right" : "text-left"
                )}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-6 bg-white border-t border-[#eef0f2]">
          <div className="relative group">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Write a response..."
              className="w-full bg-[#f8f9fb] border border-[#eef0f2] rounded-2xl py-4 px-6 pr-32 text-sm outline-none focus:border-[#4c49ed]/50 transition-all resize-none h-24"
            />
            <div className="absolute left-6 bottom-4 flex items-center gap-3 text-gray-400">
              <button className="hover:text-[#4c49ed] transition-colors"><Smile size={18} /></button>
              <button className="hover:text-[#4c49ed] transition-colors"><ImageIcon size={18} /></button>
              <button className="hover:text-[#4c49ed] transition-colors"><Paperclip size={18} /></button>
              <button className="hover:text-[#4c49ed] transition-colors"><Plus size={18} /></button>
            </div>
            <div className="absolute right-6 bottom-4 flex items-center gap-2">
              <button className="px-4 py-1.5 text-gray-400 text-xs font-bold hover:text-[#1a1a1a] transition-all">
                Send
              </button>
              <button className="px-4 py-1.5 bg-white border border-[#eef0f2] text-gray-400 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-gray-50 transition-all">
                <Check size={14} />
                Enter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Contact & Task Info */}
      <div className="w-80 bg-white border-l border-[#eef0f2] flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-8">
          {/* Profile Header */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{selectedConv.name} Austin</h3>
            <p className="text-xs text-gray-400">Product Marketing Manager at {selectedConv.company}</p>
          </div>

          {/* Task Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus size={14} className="text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Assignee</span>
            </div>
            <div className="pl-6">
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:border-blue-500/50 transition-all"
                value={selectedConv.assignee}
                onChange={(e) => {
                  const updatedConv = { ...selectedConv, assignee: e.target.value };
                  setSelectedConv(updatedConv);
                }}
              >
                {TEAM_MEMBERS.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-2">
                <ChevronDown size={14} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Key information</span>
              </div>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Mail size={14} className="text-gray-400" />
                <span>naomi.austin@unity.com</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Phone size={14} className="text-gray-400" />
                <span>(650) 555-9876</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Clock size={14} className="text-gray-400" />
                <span>Pacific Time (US & Canada)</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-2">
                <ChevronDown size={14} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
              </div>
            </div>
            <div className="pl-6 space-y-6 relative">
              <div className="absolute left-[31px] top-2 bottom-2 w-px bg-gray-100" />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 z-10">
                    <MessageSquare size={14} />
                  </div>
                  <span className="text-xs font-bold">Prospect</span>
                </div>
                <span className="text-[10px] text-gray-400">2nd April 2023</span>
              </div>
              <div className="flex items-center justify-between relative opacity-40">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 z-10">
                    <Check size={14} />
                  </div>
                  <span className="text-xs font-bold">Qualified lead</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-2">
                <ChevronDown size={14} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Tags</span>
              </div>
            </div>
            <div className="pl-6 flex flex-wrap gap-2">
              {['april-campaign', 'demo-account', 'enterprise'].map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-[10px] font-bold rounded-md text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportingView = () => (
    <div className="flex-1 overflow-y-auto p-10 bg-[#f8f9fb] space-y-10 custom-scrollbar">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Reporting</h2>
          <p className="text-gray-400">Measure and improve your entire customer experience.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
            <Download size={14} />
            Export Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tickets', value: '254', trend: '+12%', icon: FileText, color: 'text-blue-500' },
          { label: 'Average Wait Time', value: '00:12', trend: '-5%', icon: Clock, color: 'text-purple-500' },
          { label: 'Solved Tickets', value: '198', trend: '+18%', icon: Check, color: 'text-green-500' },
          { label: 'Customer Satisfaction', value: '94%', trend: '+2%', icon: Smile, color: 'text-yellow-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50", stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-green-600">{stat.trend}</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Ticket Volume</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-gray-400">Created</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-400">Solved</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REPORTING_DATA}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip />
                <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTickets)" strokeWidth={2} />
                <Area type="monotone" dataKey="solved" stroke="#22c55e" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-6">
          <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Agent Performance</h3>
          <div className="space-y-6">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400">
                  {member.avatar}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{member.name}</span>
                    <span className="text-[10px] text-gray-400">84% Efficiency</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[84%]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomersView = () => (
    <div className="flex-1 overflow-y-auto p-10 bg-[#f8f9fb] space-y-8 custom-scrollbar">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Customers</h2>
          <p className="text-gray-400">Add, search, and manage your end users.</p>
        </div>
        <button className="px-6 py-3 bg-[#4c49ed] text-white rounded-xl text-xs font-bold hover:bg-[#3f3ccf] transition-all flex items-center gap-2">
          <PlusCircle size={16} />
          Add Customer
        </button>
      </header>

      <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-12 pr-4 text-xs outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <button className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all">
            <Filter size={18} />
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
              <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</th>
              <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Updated</th>
              <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {CONVERSATIONS.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]", customer.color)}>
                      {customer.avatar}
                    </div>
                    <span className="text-xs font-bold">{customer.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs text-gray-500">{customer.name.toLowerCase()}@example.com</td>
                <td className="px-8 py-5 text-xs text-gray-500">{customer.company}</td>
                <td className="px-8 py-5 text-xs text-gray-400">2 minutes ago</td>
                <td className="px-8 py-5 text-right">
                  <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrganizationsView = () => (
    <div className="flex-1 overflow-y-auto p-10 bg-[#f8f9fb] space-y-8 custom-scrollbar">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Organizations</h2>
          <p className="text-gray-400">Manage companies and shared workspaces.</p>
        </div>
        <button className="px-6 py-3 bg-[#4c49ed] text-white rounded-xl text-xs font-bold hover:bg-[#3f3ccf] transition-all flex items-center gap-2">
          <Building2 size={16} />
          Add Organization
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Unity', 'Dropbox', 'DoorDash', 'Cloudflare', 'NIO', 'Square'].map(org => (
          <div key={org} className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-6 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                <Building2 size={24} />
              </div>
              <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">{org}</h3>
              <p className="text-xs text-gray-400">Enterprise Workspace • 12 Members</p>
            </div>
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                    {i}
                  </div>
                ))}
              </div>
              <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-main-bg text-text-main font-sans overflow-hidden rounded-[40px] border border-white/5 shadow-2xl relative">
      {/* Narrow Sidebar */}
      <aside className="w-16 bg-surface border-r border-border-muted flex flex-col items-center py-6 gap-8 shrink-0">
        <button onClick={onBack} className="p-2 text-text-muted hover:text-text-main transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setActiveView('tickets')}
            className={cn("p-2 transition-colors rounded-lg", activeView === 'tickets' ? "bg-surface-2 text-text-main" : "text-text-muted hover:text-text-main")}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setActiveView('reporting')}
            className={cn("p-2 transition-colors rounded-lg", activeView === 'reporting' ? "bg-surface-2 text-text-main" : "text-text-muted hover:text-text-main")}
          >
            <BarChart3 size={20} />
          </button>
          <button 
            onClick={() => setActiveView('customers')}
            className={cn("p-2 transition-colors rounded-lg", activeView === 'customers' ? "bg-surface-2 text-text-main" : "text-text-muted hover:text-text-main")}
          >
            <Users size={20} />
          </button>
          <button 
            onClick={() => setActiveView('organizations')}
            className={cn("p-2 transition-colors rounded-lg", activeView === 'organizations' ? "bg-surface-2 text-text-main" : "text-text-muted hover:text-text-main")}
          >
            <Building2 size={20} />
          </button>
        </div>
        <div className="mt-auto">
          <button className="p-2 text-text-muted hover:text-text-main transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </aside>

      {/* Dynamic View Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'tickets' && (
          <div className="flex h-full overflow-hidden">
            {/* Conversations List */}
            <div className="w-80 bg-surface/50 border-r border-white/5 flex flex-col shrink-0">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Tickets</h2>
                  <p className="text-xs text-text-dim">Manage active conversations</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-full text-text-dim">
                    <Filter size={18} />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-full text-text-dim">
                    <Search size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-4 mb-4">
                  <button 
                    onClick={() => setShowWhatsAppModal(true)}
                    className={cn(
                      "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border",
                      isWhatsAppLinked 
                        ? "bg-green-500/10 text-green-400 border-green-500/20" 
                        : "bg-white text-black border-white hover:bg-white/90"
                    )}
                  >
                    <QrCode size={16} />
                    {isWhatsAppLinked ? "WhatsApp Linked" : "Link WhatsApp via QR"}
                  </button>
                </div>

                {CONVERSATIONS.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={cn(
                      "w-full p-4 flex gap-4 text-left transition-all border-l-4",
                      selectedConv.id === conv.id 
                        ? "bg-white/5 text-white border-accent" 
                        : "hover:bg-white/5 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                      conv.color
                    )}>
                      {conv.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm truncate">{conv.name}</span>
                        <span className="text-[10px] text-text-dim">{conv.time}</span>
                      </div>
                      <p className="text-xs truncate text-text-dim">
                        {conv.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                          conv.status === 'solved' ? "bg-green-500/20 text-green-400" :
                          conv.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-main-bg overflow-hidden">
              <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-sm">{selectedConv.name} • {selectedConv.company}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Ticket #4291</span>
                      <div className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="text-[10px] text-accent font-bold uppercase tracking-widest">{selectedConv.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-surface p-1 rounded-lg border border-white/5">
                    {['open', 'pending', 'in-progress', 'solved'].map((s) => (
                      <button
                        key={s}
                        className={cn(
                          "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                          selectedConv.status === s ? "bg-white/10 text-white" : "text-text-dim hover:text-text-main"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="h-6 w-px bg-white/5 mx-2" />
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="p-2 hover:bg-white/5 rounded-full text-text-dim"
                  >
                    <Share2 size={18} />
                  </button>
                  <button className="px-4 py-1.5 bg-accent text-black text-xs font-bold rounded-lg hover:bg-accent/90 transition-all">
                    Mark as Solved
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {MESSAGES.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex gap-4",
                    msg.type === 'sent' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0",
                      msg.type === 'sent' ? "bg-accent text-black" : "bg-surface border border-white/10"
                    )}>
                      {msg.sender.charAt(0)}
                    </div>
                    <div className="max-w-2xl space-y-2">
                      <div className={cn(
                        "p-6 rounded-2xl text-sm leading-relaxed border",
                        msg.type === 'sent' 
                          ? "bg-surface border-white/10 text-white" 
                          : "bg-surface/50 border-white/5 text-text-main"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={cn(
                        "text-[10px] text-text-dim font-medium",
                        msg.type === 'sent' ? "text-right" : "text-left"
                      )}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-surface border-t border-white/5">
                <div className="relative group">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Write a response..."
                    className="w-full bg-main-bg border border-white/10 rounded-2xl py-4 px-6 pr-32 text-sm outline-none focus:border-accent/50 transition-all resize-none h-24 text-white"
                  />
                  <div className="absolute left-6 bottom-4 flex items-center gap-3 text-text-dim">
                    <button className="hover:text-text-main transition-colors"><Smile size={18} /></button>
                    <button className="hover:text-text-main transition-colors"><ImageIcon size={18} /></button>
                    <button className="hover:text-text-main transition-colors"><Paperclip size={18} /></button>
                    <button className="hover:text-text-main transition-colors"><Plus size={18} /></button>
                  </div>
                  <div className="absolute right-6 bottom-4 flex items-center gap-2">
                    <button className="px-4 py-1.5 text-text-dim text-xs font-bold hover:text-white transition-all">
                      Send
                    </button>
                    <button className="px-4 py-1.5 bg-surface border border-white/10 text-text-dim text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-white/5 transition-all">
                      <Check size={14} />
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 bg-surface/50 border-l border-white/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
              <div className="p-8 space-y-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{selectedConv.name} Austin</h3>
                  <p className="text-xs text-text-dim">Product Marketing Manager at {selectedConv.company}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserPlus size={14} className="text-text-dim" />
                    <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Assignee</span>
                  </div>
                  <div className="pl-6">
                    <select 
                      className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:border-accent/50 transition-all text-white"
                      value={selectedConv.assignee}
                      onChange={(e) => {
                        const updatedConv = { ...selectedConv, assignee: e.target.value };
                        setSelectedConv(updatedConv);
                      }}
                    >
                      {TEAM_MEMBERS.map(member => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ChevronDown size={14} className="text-text-dim" />
                      <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Key information</span>
                    </div>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <Mail size={14} className="text-text-dim" />
                      <span>naomi.austin@unity.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <Phone size={14} className="text-text-dim" />
                      <span>(650) 555-9876</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <Clock size={14} className="text-text-dim" />
                      <span>Pacific Time (US & Canada)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ChevronDown size={14} className="text-text-dim" />
                      <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Status</span>
                    </div>
                  </div>
                  <div className="pl-6 space-y-6 relative">
                    <div className="absolute left-[31px] top-2 bottom-2 w-px bg-white/5" />
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent z-10">
                          <MessageSquare size={14} />
                        </div>
                        <span className="text-xs font-bold">Prospect</span>
                      </div>
                      <span className="text-[10px] text-text-dim">2nd April 2023</span>
                    </div>
                    <div className="flex items-center justify-between relative opacity-40">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-dim z-10">
                          <Check size={14} />
                        </div>
                        <span className="text-xs font-bold">Qualified lead</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ChevronDown size={14} className="text-text-dim" />
                      <span className="text-xs font-bold uppercase tracking-widest text-text-dim">Tags</span>
                    </div>
                  </div>
                  <div className="pl-6 flex flex-wrap gap-2">
                    {['april-campaign', 'demo-account', 'enterprise'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-white/5 text-[10px] font-bold rounded-md text-text-dim border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'reporting' && (
          <div className="flex-1 overflow-y-auto p-10 bg-main-bg space-y-10 custom-scrollbar">
            <header className="flex items-end justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight text-white">Reporting</h2>
                <p className="text-text-dim">Measure and improve your entire customer experience.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-surface border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/5 transition-all text-white">
                  <Download size={14} />
                  Export Data
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Tickets', value: '254', trend: '+12%', icon: FileText, color: 'text-blue-400' },
                { label: 'Average Wait Time', value: '00:12', trend: '-5%', icon: Clock, color: 'text-purple-400' },
                { label: 'Solved Tickets', value: '198', trend: '+18%', icon: Check, color: 'text-green-400' },
                { label: 'Customer Satisfaction', value: '94%', trend: '+2%', icon: Smile, color: 'text-yellow-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface border border-white/5 p-8 rounded-[32px] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5", stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-green-400">{stat.trend}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface border border-white/5 p-8 rounded-[32px] shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-text-dim">Ticket Volume</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] text-text-dim">Created</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[10px] text-text-dim">Solved</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REPORTING_DATA}>
                      <defs>
                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff40'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff40'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTickets)" strokeWidth={2} />
                      <Area type="monotone" dataKey="solved" stroke="#22c55e" fillOpacity={0} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface border border-white/5 p-8 rounded-[32px] shadow-sm space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-widest text-text-dim">Agent Performance</h3>
                <div className="space-y-6">
                  {TEAM_MEMBERS.map((member) => (
                    <div key={member.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-bold text-text-dim">
                        {member.avatar}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{member.name}</span>
                          <span className="text-[10px] text-text-dim">84% Efficiency</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent w-[84%]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'customers' && (
          <div className="flex-1 overflow-y-auto p-10 bg-main-bg space-y-8 custom-scrollbar">
            <header className="flex items-end justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight text-white">Customers</h2>
                <p className="text-text-dim">Add, search, and manage your end users.</p>
              </div>
              <button className="px-6 py-3 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-2">
                <PlusCircle size={16} />
                Add Customer
              </button>
            </header>

            <div className="bg-surface border border-white/5 rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input 
                    type="text" 
                    placeholder="Search customers..."
                    className="w-full bg-main-bg border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-xs outline-none focus:border-accent/50 transition-all text-white"
                  />
                </div>
                <button className="p-2.5 bg-main-bg border border-white/10 rounded-xl text-text-dim hover:text-white transition-all">
                  <Filter size={18} />
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Name</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Email</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Company</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Last Updated</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {CONVERSATIONS.map(customer => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]", customer.color)}>
                            {customer.avatar}
                          </div>
                          <span className="text-xs font-bold text-white">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs text-text-dim">{customer.name.toLowerCase()}@example.com</td>
                      <td className="px-8 py-5 text-xs text-text-dim">{customer.company}</td>
                      <td className="px-8 py-5 text-xs text-text-dim">2 minutes ago</td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-text-dim hover:text-white transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'organizations' && (
          <div className="flex-1 overflow-y-auto p-10 bg-main-bg space-y-8 custom-scrollbar">
            <header className="flex items-end justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight text-white">Organizations</h2>
                <p className="text-text-dim">Manage companies and shared workspaces.</p>
              </div>
              <button className="px-6 py-3 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-2">
                <Building2 size={16} />
                Add Organization
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Unity', 'Dropbox', 'DoorDash', 'Cloudflare', 'NIO', 'Square'].map(org => (
                <div key={org} className="bg-surface border border-white/5 p-8 rounded-[32px] shadow-sm space-y-6 hover:border-white/20 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-text-dim group-hover:bg-accent/10 group-hover:text-accent transition-all">
                      <Building2 size={24} />
                    </div>
                    <button className="p-2 text-text-dim hover:text-white transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">{org}</h3>
                    <p className="text-xs text-text-dim">Enterprise Workspace • 12 Members</p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-white/10 flex items-center justify-center text-[8px] font-bold text-text-dim">
                          {i}
                        </div>
                      ))}
                    </div>
                    <button className="text-[10px] font-bold text-accent uppercase tracking-widest">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share to Group Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-white/10 rounded-[40px] shadow-2xl p-10 space-y-8"
            >
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-white">Share to Group</h3>
                <p className="text-sm text-text-dim">Assign this ticket to a team or share it with a specific group.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Select Team/Group</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Support Team', 'Engineering', 'Sales', 'Product Feedback'].map(group => (
                      <button 
                        key={group}
                        className="w-full p-4 bg-main-bg border border-white/10 rounded-2xl text-left hover:border-accent/50 transition-all flex items-center justify-between group"
                      >
                        <span className="text-sm font-bold text-white">{group}</span>
                        <Plus size={16} className="text-text-dim group-hover:text-accent" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Assign Individual</label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_MEMBERS.map(member => (
                      <button 
                        key={member.id}
                        className="px-4 py-2 bg-main-bg border border-white/10 rounded-xl text-xs font-bold text-text-dim hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all"
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-4 bg-accent text-black rounded-2xl text-xs font-bold hover:bg-accent/90 transition-all"
                >
                  Confirm Share
                </button>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-4 bg-white/5 text-text-dim rounded-2xl text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Link Modal */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-white/10 rounded-[40px] shadow-2xl p-10 text-center space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Link WhatsApp</h3>
                <p className="text-sm text-text-dim">Scan the QR code with your phone to sync all conversations into Powerdesk.</p>
              </div>

              <div className="aspect-square w-64 mx-auto bg-main-bg rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
                <QrCode size={120} className="text-white/10 group-hover:text-white transition-colors duration-500" />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => {
                      setIsWhatsAppLinked(true);
                      setShowWhatsAppModal(false);
                    }}
                    className="px-6 py-3 bg-accent text-black rounded-xl text-xs font-bold shadow-xl"
                  >
                    Simulate Scan
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-left p-4 bg-main-bg rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Sync History</p>
                    <p className="text-[10px] text-text-dim">Import last 30 days of chats</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-main-bg rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Real-time Reply</p>
                    <p className="text-[10px] text-text-dim">Send and receive instantly</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="text-xs font-bold text-text-dim hover:text-white transition-colors"
              >
                Cancel Setup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
