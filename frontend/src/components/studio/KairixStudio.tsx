import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Sparkles, 
  Users, 
  Palette, 
  Layers, 
  Play, 
  Clock, 
  Zap, 
  Activity, 
  LayoutDashboard, 
  Kanban, 
  Network, 
  BookOpen, 
  ArrowBigUp,
  ArrowBigDown,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  X
} from 'lucide-react';

const studioColorMap: Record<string, { border: string; bg: string; text: string; gradient: string; glow: string }> = {
  indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-600', text: 'text-indigo-500', gradient: 'from-indigo-500 via-indigo-600 to-violet-600', glow: 'shadow-indigo-500/20' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-600', text: 'text-emerald-500', gradient: 'from-emerald-500 via-emerald-600 to-teal-500', glow: 'shadow-emerald-500/20' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-600', text: 'text-amber-500', gradient: 'from-amber-500 via-amber-600 to-orange-500', glow: 'shadow-amber-500/20' },
  pink: { border: 'border-pink-500/30', bg: 'bg-pink-600', text: 'text-pink-500', gradient: 'from-pink-500 via-pink-600 to-rose-500', glow: 'shadow-pink-500/20' },
  violet: { border: 'border-violet-500/30', bg: 'bg-violet-600', text: 'text-violet-500', gradient: 'from-violet-500 via-violet-600 to-purple-600', glow: 'shadow-violet-500/20' },
  teal: { border: 'border-teal-500/30', bg: 'bg-teal-600', text: 'text-teal-500', gradient: 'from-teal-500 via-teal-600 to-cyan-500', glow: 'shadow-teal-500/20' },
};

export const KairixStudio: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Studio theme mode (dark vs light)
  const [studioTheme, setStudioTheme] = useState<'dark' | 'light'>('dark');
  
  // Interactive customizer active brand color accent
  const [accent, setAccent] = useState<string>('indigo');

  // Sandbox states
  const [sandboxView, setSandboxView] = useState<'dashboard' | 'board' | 'dependency' | 'logs'>('dashboard');
  const [sandboxVoteScore, setSandboxVoteScore] = useState(14);
  const [sandboxVote, setSandboxVote] = useState<'up' | 'down' | null>(null);
  const [sandboxComments, setSandboxComments] = useState<Array<{ id: string; user: string; text: string; replies?: any[] }>>([
    { id: '1', user: 'u/jane_smith', text: 'The thread hover highlights are incredibly visual. Perfect for codebase status logging!' },
    { id: '2', user: 'u/john_doe', text: 'Agreed! Casted my upvote instantly.' }
  ]);
  const [newSandboxComment, setNewSandboxComment] = useState('');
  
  // Sandbox Kanban states
  const [selectedSandboxTask, setSelectedSandboxTask] = useState<string | null>(null);

  const activeAccent = studioColorMap[accent] || studioColorMap.indigo;

  const handlePostVote = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      if (sandboxVote === 'up') {
        setSandboxVoteScore(14);
        setSandboxVote(null);
      } else {
        setSandboxVoteScore(sandboxVote === 'down' ? 16 : 15);
        setSandboxVote('up');
      }
    } else {
      if (sandboxVote === 'down') {
        setSandboxVoteScore(14);
        setSandboxVote(null);
      } else {
        setSandboxVoteScore(sandboxVote === 'up' ? 12 : 13);
        setSandboxVote('down');
      }
    }
  };

  const handleAddSandboxComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSandboxComment.trim()) return;
    setSandboxComments(prev => [
      ...prev,
      { id: Date.now().toString(), user: 'u/anonymous_tester', text: newSandboxComment }
    ]);
    setNewSandboxComment('');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${
      studioTheme === 'dark' ? 'bg-[#06080e] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* ═══════════════════════ NAVIGATION HEADER ═══════════════════════ */}
      <header className={`sticky top-0 h-20 px-6 lg:px-12 flex items-center justify-between border-b transition-all duration-300 z-50 backdrop-blur-md ${
        studioTheme === 'dark' ? 'bg-[#06080e]/80 border-slate-850' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-br ${activeAccent.gradient} rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg ${activeAccent.glow}`}>
            KX
          </div>
          <span className="font-black text-lg tracking-tight">KairiX <span className="font-light text-slate-450 dark:text-slate-400">Studio</span></span>
        </div>

        {/* Center menu */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <a href="#features" className="hover:text-indigo-500 transition-colors">Features</a>
          <a href="#sandbox" className="hover:text-indigo-500 transition-colors">Workspace Sandbox</a>
          <a href="#themes" className="hover:text-indigo-500 transition-colors">Accent Customizer</a>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Light/Dark toggler */}
          <button 
            onClick={() => setStudioTheme(t => t === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              studioTheme === 'dark' ? 'border-slate-800 text-amber-400 hover:bg-slate-900' : 'border-slate-250 text-indigo-600 hover:bg-slate-100'
            }`}
          >
            {studioTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Authentication CTAs */}
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className={`px-5 py-2.5 bg-gradient-to-r ${activeAccent.gradient} hover:brightness-110 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer`}
            >
              Enter Studio Console
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="hidden sm:block px-4 py-2.5 text-xs font-extrabold hover:text-indigo-500 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className={`px-5 py-2.5 bg-gradient-to-r ${activeAccent.gradient} hover:brightness-110 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer`}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════ HERO BANNER ═══════════════════════ */}
      <section className="relative px-6 py-20 lg:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow Spheres */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br ${activeAccent.gradient} opacity-[0.06] dark:opacity-[0.08] blur-3xl pointer-events-none`} />

        <div className="max-w-4xl space-y-6 z-10 select-none">
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/5 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.05] rounded-full w-fit mx-auto shadow-sm backdrop-blur-md">
            <Zap size={13} className="text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450">Studio Edition Launchpad</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
            A Next-Gen Visual Workspace Tailored for <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeAccent.gradient}`}>SaaS Development</span>
          </h1>

          <p className="text-base sm:text-lg font-medium text-slate-550 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            KairiX Studio transforms collaborative project management with physical DOM spotlights, real-time multiplayer presences, visual dependency maps, and a Reddit-style threaded status log. 
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <a 
              href="#sandbox"
              className={`flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r ${activeAccent.gradient} text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg ${activeAccent.glow} hover:-translate-y-0.5 transition-all duration-150 active:scale-95 cursor-pointer`}
            >
              <Play size={13} fill="currentColor" />
              <span>Try Interactive Sandbox</span>
            </a>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-3.5 bg-white/5 dark:bg-white/[0.02] border border-gray-250 dark:border-white/[0.08] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
            >
              Claim Free Seat
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ INTERACTIVE WORKSPACE SANDBOX ═══════════════════════ */}
      <section id="sandbox" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
        <div className="text-center space-y-2.5 mb-12 select-none">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            Workspace Interactive Sandbox
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl mx-auto">
            Experience the KairiX layout immediately! Click the sandbox navigation links below to interact with mock dashboards, boards, timelines, and threaded posts live.
          </p>
        </div>

        {/* Desktop Mock Container */}
        <div className={`w-full h-[520px] rounded-[2.5rem] border overflow-hidden flex shadow-2xl transition-all duration-300 ${
          studioTheme === 'dark' ? 'bg-[#090d16] border-slate-850/60 shadow-indigo-900/5' : 'bg-white border-slate-200'
        }`}>
          
          {/* Sandbox Left Sidebar (30% on desktop) */}
          <aside className="w-16 sm:w-56 bg-gray-50/50 dark:bg-black/10 border-r border-gray-150 dark:border-gray-850 shrink-0 flex flex-col justify-between py-6 select-none">
            <div className="space-y-6">
              <div className="px-5 hidden sm:block">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sandbox Navigation</span>
              </div>
              <nav className="px-3 space-y-1">
                {[
                  { id: 'dashboard', label: 'Console Dashboard', icon: LayoutDashboard },
                  { id: 'board', label: 'Multiplayer Board', icon: Kanban },
                  { id: 'dependency', label: 'Dependency Path', icon: Network },
                  { id: 'logs', label: ' Reddit Status Logs', icon: BookOpen },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = sandboxView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSandboxView(item.id as any);
                        setSelectedSandboxTask(null);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-left cursor-pointer group ${
                        active 
                          ? `bg-indigo-500/10 ${activeAccent.text} font-black border-l-4 border-indigo-600` 
                          : 'text-gray-550 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-xs font-bold hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            
            <div className="px-4 hidden sm:block">
              <div className="p-3 bg-gray-100 dark:bg-slate-900 rounded-xl text-center space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase">Sandbox Mode</p>
                <p className="text-[10px] font-black text-indigo-500">Live Preview</p>
              </div>
            </div>
          </aside>

          {/* Sandbox Main Work Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* Sandbox Top Header bar */}
            <div className="h-14 px-6 border-b border-gray-150 dark:border-gray-850 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black capitalize tracking-wide">{sandboxView} Sandbox View</span>
              </div>
              
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center border border-white dark:border-[#090d16]" title="Jane (Active)">JS</div>
                <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-[8px] font-bold flex items-center justify-center border border-white dark:border-[#090d16]" title="John (Active)">JD</div>
              </div>
            </div>

            {/* Sandbox Scrolling viewport */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
              
              {/* ═══════════════ SANDBOX VIEW: DASHBOARD ═══════════════ */}
              {sandboxView === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
                    {[
                      { label: 'Total Sandbox Tasks', value: '12', icon: <Layers size={14} />, border: `border-b-2 ${accent === 'indigo' ? 'border-indigo-500' : activeAccent.border}` },
                      { label: 'Multiplayer Coders', value: '3 Active', icon: <Users size={14} />, border: 'border-b-2 border-emerald-500' },
                      { label: 'Estimated Workload', value: '72.2h', icon: <Clock size={14} />, border: 'border-b-2 border-amber-500' },
                      { label: 'Net Score Velocity', value: '+45%', icon: <Zap size={14} />, border: 'border-b-2 border-pink-500' },
                    ].map((card, i) => (
                      <div key={i} className={`glass-panel p-4 rounded-2xl flex flex-col justify-between ${card.border}`}>
                        <div className="flex items-center justify-between text-gray-400 mb-2">
                          <span className="text-[9px] font-black uppercase tracking-wider">{card.label}</span>
                          {card.icon}
                        </div>
                        <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{card.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sandbox Operational Audit list */}
                  <div className="glass-panel p-5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 flex items-center gap-2 select-none">
                      <Activity size={12} /> Sandbox Live Activity Feed
                    </h4>
                    <div className="space-y-3">
                      {[
                        { u: 'u/jane_smith', action: 'completed estimation blueprint', time: '4m ago', color: 'bg-emerald-500' },
                        { u: 'u/john_doe', action: 'voted up Operational post in r/Apollo', time: '12m ago', color: 'bg-indigo-500' },
                        { u: 'u/anonymous_tester', action: 'entered KairiX interactive sandbox', time: 'just now', color: 'bg-pink-500' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-[11px] font-bold p-2.5 bg-gray-50/50 dark:bg-black/10 rounded-xl border border-gray-100 dark:border-gray-850">
                          <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-800 dark:text-gray-200">{item.u}</span>
                            <span className="text-gray-400 dark:text-gray-500 font-medium"> {item.action}</span>
                          </div>
                          <span className="text-gray-400 font-medium text-[10px] pr-1">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ═══════════════ SANDBOX VIEW: BOARD ═══════════════ */}
              {sandboxView === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full animate-fade-in relative">
                  
                  {/* Kanban Columns */}
                  {[
                    { title: 'Pending', count: 1, task: { id: 't1', title: 'Design branding customizer', priority: 'medium', estimation: '8h' } },
                    { title: 'In Progress', count: 1, task: { id: 't2', title: 'Overhaul guided tour backdrop spotlight', priority: 'high', estimation: '12h', active: true } },
                    { title: 'Completed', count: 1, task: { id: 't3', title: 'Code split app routes via React.lazy', priority: 'low', estimation: '4h' } },
                  ].map((col, idx) => (
                    <div key={idx} className="bg-gray-50/50 dark:bg-[#070b12]/30 border border-gray-150 dark:border-gray-850 rounded-2xl p-3 space-y-3 flex flex-col justify-start">
                      <div className="flex items-center justify-between px-2 py-1 select-none">
                        <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">{col.title}</span>
                        <span className="text-[9px] font-black bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{col.count}</span>
                      </div>

                      {/* Mock Task Card */}
                      <div 
                        onClick={() => setSelectedSandboxTask(col.task.id)}
                        className={`p-3 bg-white dark:bg-[#0c1018] rounded-xl border transition-all cursor-pointer select-none relative hover:border-indigo-500/50 hover:shadow-md ${
                          selectedSandboxTask === col.task.id 
                            ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10' 
                            : 'border-gray-150 dark:border-gray-850'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            col.task.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                              : col.task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                          }`}>
                            {col.task.priority}
                          </span>
                          <span className="text-[9px] text-gray-400 font-extrabold">{col.task.estimation}</span>
                        </div>
                        <p className="text-xs font-black text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                          {col.task.title}
                        </p>

                        {/* Multiplayer typing alert cue inside mock board */}
                        {col.task.active && (
                          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 text-[8px] font-extrabold text-emerald-500">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            <span>Jane is typing in this sheet...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Sliding task detail simulation panel */}
                  {selectedSandboxTask && (
                    <div className="absolute inset-y-0 right-0 w-72 bg-white dark:bg-[#0a0d16] border-l border-gray-150 dark:border-gray-850 shadow-2xl p-4 flex flex-col justify-between animate-slide-in-right z-20">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sandbox Details Sheet</span>
                          <button 
                            onClick={() => setSelectedSandboxTask(null)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white leading-tight">
                            {selectedSandboxTask === 't1' 
                              ? 'Design branding customizer' 
                              : selectedSandboxTask === 't2'
                                ? 'Overhaul guided tour backdrop spotlight'
                                : 'Code split app routes via React.lazy'}
                          </h4>
                          <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                            Simulated sliding Asana-Style Side Sheet. Demonstrates metadata, play/pause HUD timers, and live typing indicator capabilities of KairiX.
                          </p>
                        </div>

                        {/* Simulated typing indicator */}
                        <div className="p-2.5 bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-gray-850 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                              <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                              <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.4s]" />
                            </div>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Jane Smith is typing</span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">"Just added the four cutout backdrop quadrants. Give it a test u/john."</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedSandboxTask(null)}
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all"
                      >
                        Close Preview
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* ═══════════════ SANDBOX VIEW: DEPENDENCY ═══════════════ */}
              {sandboxView === 'dependency' && (
                <div className="h-full relative overflow-hidden bg-gray-50/50 dark:bg-[#080b12] rounded-3xl border border-gray-150 dark:border-gray-850 flex flex-col justify-between p-4 animate-fade-in select-none">
                  
                  {/* Grid background */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern id="sandbox-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="10" cy="10" r="0.6" fill={studioTheme === 'light' ? '#64748b' : '#94a3b8'} />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#sandbox-grid)" />
                    </svg>
                  </div>

                  {/* Info Header */}
                  <div className="relative z-10 flex items-center justify-between border-b border-gray-150/40 dark:border-gray-800/40 pb-2">
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Workflow Chart Preview</span>
                      <p className="text-xs font-black text-gray-900 dark:text-white leading-none">Apollo Timeline Map</p>
                    </div>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded">Critical Path Mode</span>
                  </div>

                  {/* Flow Map Visualizer */}
                  <div className="relative z-10 flex items-center justify-center gap-4 py-8">
                    <div className="px-3 py-2 bg-white dark:bg-[#0c1018] border border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-black shadow-sm text-center">
                      <p className="text-gray-450 block mb-0.5">Step 1</p>
                      <p className="text-gray-800 dark:text-gray-200">Blueprint Design</p>
                    </div>

                    <div className="w-8 h-[2px] bg-gradient-to-r from-indigo-500 to-emerald-500 relative shrink-0">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    </div>

                    <div className="px-3 py-2 bg-white dark:bg-[#0c1018] border border-indigo-500 dark:border-indigo-800 rounded-xl text-[10px] font-black shadow-sm text-center ring-2 ring-indigo-500/10">
                      <p className="text-indigo-500 block mb-0.5">Step 2</p>
                      <p className="text-gray-800 dark:text-gray-200 animate-pulse">Tour Spotlight Coding</p>
                    </div>

                    <div className="w-8 h-[2px] bg-gradient-to-r from-emerald-500 to-pink-500 relative shrink-0">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
                    </div>

                    <div className="px-3 py-2 bg-white dark:bg-[#0c1018] border border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-black shadow-sm text-center">
                      <p className="text-gray-450 block mb-0.5">Step 3</p>
                      <p className="text-gray-800 dark:text-gray-200">Client Staging</p>
                    </div>
                  </div>

                  {/* Viewport Zoom controls */}
                  <div className="relative z-10 flex items-center justify-between text-[8px] font-black uppercase text-gray-400 border-t border-gray-150/40 dark:border-gray-800/40 pt-2.5">
                    <span>Scroll to zoom · drag canvas to pan</span>
                    <span className="text-indigo-500">100% Zoom calibrated</span>
                  </div>

                </div>
              )}

              {/* ═══════════════ SANDBOX VIEW: LOGS ═══════════════ */}
              {sandboxView === 'logs' && (
                <div className="space-y-4 animate-fade-in select-none">
                  
                  {/* Community header */}
                  <div className="flex items-center gap-2 text-xs font-black text-gray-800 dark:text-gray-200 border-b border-gray-150 dark:border-gray-850 pb-2">
                    <ShieldCheck size={14} className="text-[#ff4500]" />
                    <span>r/KairixStudioCommunity Operational Stream</span>
                  </div>

                  {/* Reddit Post Overhaul card */}
                  <div className="bg-white dark:bg-[#0c1018] rounded-2xl border border-gray-150 dark:border-gray-850 flex relative shadow-sm">
                    {/* Left score arrows */}
                    <div className="w-12 bg-gray-50/50 dark:bg-black/10 flex flex-col items-center py-3 border-r border-gray-105 dark:border-gray-850 shrink-0">
                      <button 
                        onClick={() => handlePostVote('up')}
                        className={`transition-all duration-150 active:scale-125 cursor-pointer ${
                          sandboxVote === 'up' ? 'text-[#ff4500]' : 'text-gray-400 hover:text-slate-100'
                        }`}
                      >
                        <ArrowBigUp size={20} fill={sandboxVote === 'up' ? 'currentColor' : 'none'} />
                      </button>
                      
                      <span className={`text-[10px] font-black my-0.5 ${
                        sandboxVote === 'up' ? 'text-[#ff4500]' : sandboxVote === 'down' ? 'text-[#7193ff]' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {sandboxVoteScore}
                      </span>
                      
                      <button 
                        onClick={() => handlePostVote('down')}
                        className={`transition-all duration-150 active:scale-125 cursor-pointer ${
                          sandboxVote === 'down' ? 'text-[#7193ff]' : 'text-gray-400 hover:text-slate-100'
                        }`}
                      >
                        <ArrowBigDown size={20} fill={sandboxVote === 'down' ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Right post contents */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] mb-2 leading-none text-gray-450">
                        <span className="font-black text-gray-800 dark:text-gray-200">r/ApolloProject</span>
                        <span>•</span>
                        <span>Posted by u/jane_smith</span>
                      </div>
                      
                      <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-bold">
                        Created the Reddit-style logs overhaul inside KairiX Studio! It fully supports nested comments, vertical guide connectors, and active vote rails. Give it a reply below!
                      </p>

                      {/* Seeded Comments */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-850 space-y-3">
                        {sandboxComments.map((comment) => (
                          <div key={comment.id} className="flex gap-2 relative">
                            {/* Nested thread connector line */}
                            <div className="w-[1.5px] bg-gray-100 dark:bg-gray-800 hover:bg-indigo-500 absolute top-5 bottom-0 left-[7px] cursor-pointer" />
                            
                            <div className="w-4 h-4 rounded-full bg-indigo-650 text-white text-[7px] font-bold flex items-center justify-center shrink-0">
                              {comment.user.charAt(2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 text-[10px]">
                              <div className="flex items-center gap-1.5 text-gray-400 mb-0.5 leading-none">
                                <span className="font-extrabold text-gray-750 dark:text-gray-200">{comment.user}</span>
                                <span>•</span>
                                <span>12m ago</span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 font-bold leading-relaxed">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Comment Simulation Form */}
                      <form onSubmit={handleAddSandboxComment} className="mt-4 flex gap-2 items-stretch pt-3 border-t border-dashed border-gray-100 dark:border-gray-850">
                        <textarea
                          value={newSandboxComment}
                          onChange={(e) => setNewSandboxComment(e.target.value)}
                          placeholder="Cast a status comment..."
                          rows={1}
                          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[34px] transition-all"
                        />
                        <button
                          type="submit"
                          className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                        >
                          Comment
                        </button>
                      </form>

                    </div>
                  </div>

                </div>
              )}

            </div>
          </main>
        </div>
      </section>

      {/* ═══════════════════════ ACCENT PALETTE CUSTOMIZER SHOWCASE ═══════════════════════ */}
      <section id="themes" className="px-6 py-16 bg-gray-50/50 dark:bg-black/10 border-y border-gray-150/40 dark:border-slate-850/60 select-none">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="p-2.5 bg-indigo-500/10 rounded-2xl w-fit mx-auto border border-indigo-500/20 text-indigo-500">
            <Palette size={20} />
          </div>
          
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            White-Label Brand Propagation
          </h2>
          
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">
            Customize the KairiX console aesthetic instantly for your clients. Click a color accent below to see this landing page's gradients, badges, and button glows update in real time!
          </p>

          {/* Glowing Accents Selector */}
          <div className="flex items-center justify-center gap-3.5 pt-4">
            {Object.entries(studioColorMap).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setAccent(key)}
                className={`w-10 h-10 rounded-full ${value.bg} flex items-center justify-center cursor-pointer transition-all duration-300 border-2 hover:scale-110 active:scale-95 ${
                  accent === key 
                    ? 'border-gray-900 dark:border-white ring-4 ring-offset-4 dark:ring-offset-[#06080e] ring-indigo-500 shadow-lg' 
                    : 'border-transparent'
                }`}
                title={`Theme: ${key}`}
              >
                {accent === key && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-4">
            propagation matches client white-label requirements instantly
          </p>
        </div>
      </section>

      {/* ═══════════════════════ KEY CAPABILITY FEATURE GRID ═══════════════════════ */}
      <section id="features" className="px-6 lg:px-12 py-20 max-w-7xl mx-auto select-none">
        <div className="text-center space-y-2 mb-16">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            Engineered for Executive Polish
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl mx-auto">
            KairiX Studio is not an MVP shell. It features high-end custom features built to deliver immediate visual impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Live Team Collaboration Presence',
              desc: 'Pulsing online avatar rings in headers, direct task view indicators, and animated typing alerts show collaborator actions in real time.',
              icon: <Users className="text-pink-500 shrink-0 w-6 h-6" />,
              accent: 'border-t-2 border-pink-500'
            },
            {
              title: 'Ticking HUD Time Tracking',
              desc: 'A dedicated floating countdown timer logs active hours persistently in the sidebar. Pausing and stopping syncs bi-directionally across views.',
              icon: <Clock className="text-emerald-500 shrink-0 w-6 h-6" />,
              accent: 'border-t-2 border-emerald-500'
            },
            {
              title: 'Daily Status Log Boards',
              desc: 'Threaded Operational update channels organized like Reddit community boards. Cast upvotes, nested answers, and resolve developer blockers.',
              icon: <BookOpen className="text-amber-500 shrink-0 w-6 h-6" />,
              accent: 'border-t-2 border-amber-500'
            },
            {
              title: 'Auditing Operations Feed',
              desc: 'Keep track of commits, uploads, and changes in a clean activity timeline. Proves project momentum and developer activity to clients.',
              icon: <Activity className="text-indigo-500 shrink-0 w-6 h-6" />,
              accent: 'border-t-2 border-indigo-500'
            },
            {
              title: 'Physical Onboarding Spotlights',
              desc: 'Upgraded guided tour showcasing capabilities with interactive four-quadrant backdrops. Highlights actual UI nodes with click-through support.',
              icon: <Sparkles className="text-violet-500 shrink-0 w-6 h-6" />,
              accent: 'border-t-2 border-violet-500'
            },
            {
              title: 'Visual Document Card Grids',
              desc: 'Upload files and view assets in modern visual cards instead of standard directory lists. Dropping files triggers custom visual zones.',
              icon: <Layers className="text-teal-500 shrink-0 w-6 h-6" />,
              accent: 'border-t-2 border-teal-500'
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className={`glass-panel glass-panel-hover p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 border-x-0 border-b-0 ${feature.accent}`}
            >
              <div className="space-y-4">
                <div className="p-3 bg-gray-50/50 dark:bg-black/20 w-fit rounded-2xl border border-gray-100 dark:border-gray-800">
                  {feature.icon}
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{feature.title}</h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 font-medium leading-relaxed">{feature.desc}</p>
              </div>
              
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest pt-4 hover:translate-x-1 transition-transform cursor-pointer">
                <span>Explore Feature</span>
                <ChevronRight size={10} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className={`py-12 border-t px-6 lg:px-12 select-none transition-colors duration-300 text-center ${
        studioTheme === 'dark' ? 'bg-[#04060b] border-slate-850 text-gray-500' : 'bg-slate-100 border-slate-200 text-gray-550'
      }`}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${activeAccent.gradient} rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm`}>
              KX
            </div>
            <span className="font-extrabold text-sm text-gray-900 dark:text-white">KairiX Studio</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-450 dark:text-slate-500">
          © 2026 KairiX Enterprise. All rights reserved.
          <p>
          Crafted for OryFolks - A Unified SaaS Project Management Platform.
          </p>
          </p>
        </div>
      </footer>

    </div>
  );
};
