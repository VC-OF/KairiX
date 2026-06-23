import React from 'react';
import { useStore } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import {
  LayoutDashboard,
  Kanban,
  BookOpen,
  Users,
  Plus,
  Archive,
  User,
  ChevronDown,
  Clock,
  TrendingUp,
  FileText,
  Network,
  Play,
  Pause,
  Square,
  Calendar,
  Menu,
  Pin,
  Search,
  FolderKanban,
} from 'lucide-react';
import { LogoCompact } from '../ui/Logo';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../utils/api';

const formatCamelBack = (str: string) => {
  if (!str) return '';
  const normalized = str.replace(/&/g, 'n');
  return normalized
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const navItems = [
  {
    view: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & stats',
    color: '#0ea5e9', // Cyber Cyan / Sky Blue
  },
  {
    view: 'board' as const,
    label: 'Kanban Board',
    icon: Kanban,
    description: 'Task management',
    color: '#6366f1', // Indigo
  },
  {
    view: 'dependency' as const,
    label: 'Dependency Map',
    icon: Network,
    description: 'Interactive graph',
    color: '#10b981', // Emerald Green
  },
  {
    view: 'calendar' as const,
    label: 'Calendar View',
    icon: Calendar,
    description: 'Work hours calendar',
    color: '#f43f5e', // Rose Red
  },
  {
    view: 'analytics' as const,
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Productivity stats',
    color: '#f97316', // Sunset Orange
  },
  {
    view: 'logs' as const,
    label: 'Daily Logs',
    icon: BookOpen,
    description: 'Status updates',
    color: '#8b5cf6', // Royal Violet
  },
  {
    view: 'tracker' as const,
    label: 'Time Tracker',
    icon: Clock,
    description: 'Track task time',
    color: '#ec4899', // Hot Pink
  },
  {
    view: 'members' as const,
    label: 'Team Members',
    icon: Users,
    description: 'Manage team',
    color: '#3b82f6', // Ocean Blue
  },
  {
    view: 'files' as const,
    label: 'Files & Docs',
    icon: FileText,
    description: 'Project documents',
    color: '#14b8a6', // Bright Teal
  },
  {
    view: 'profile' as const,
    label: 'My Profile',
    icon: User,
    description: 'Account settings',
    color: '#d946ef', // Vibrant Fuchsia
  },
];

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentUser,
    tasks,
    project,
    projects,
    setProject,
    addProject,
    showArchived,
    setShowArchived,
    globalActiveTimers,
    setGlobalActiveTimers,
    teamLeadEnabled,
    toggleSidebar,
    pinnedProjects,
    togglePinProject,
    setSidebarWidth,
  } = useStore();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [isTimersExpanded, setIsTimersExpanded] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // ── Drag-to-resize logic ───────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarRef.current?.offsetWidth ?? 256;

    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.min(340, Math.max(180, startWidth + ev.clientX - startX));
      if (sidebarRef.current) sidebarRef.current.style.width = `${newWidth}px`;
    };
    const onUp = (ev: MouseEvent) => {
      const finalWidth = Math.min(340, Math.max(180, startWidth + ev.clientX - startX));
      setSidebarWidth(finalWidth);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [setSidebarWidth]);

  // Local state for seconds to avoid spamming the global store every second
  const [localSeconds, setLocalSeconds] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialSeconds: Record<string, number> = {};
    globalActiveTimers.forEach(t => {
      initialSeconds[t.taskId] = t.seconds;
    });
    setLocalSeconds(prev => ({ ...initialSeconds, ...prev }));
  }, [globalActiveTimers]);

  useEffect(() => {
    const activeTimers = globalActiveTimers.filter(t => !t.isPaused);
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      setLocalSeconds(prev => {
        const next = { ...prev };
        let syncStore = false;
        activeTimers.forEach(t => {
          next[t.taskId] = (next[t.taskId] || t.seconds) + 1;
          if (next[t.taskId] % 5 === 0) syncStore = true;
        });

        if (syncStore) {
           useStore.setState(state => {
              const updated = state.globalActiveTimers.map(t => {
                 if (!t.isPaused && next[t.taskId]) {
                    return { ...t, seconds: next[t.taskId] };
                 }
                 return t;
              });
              return { globalActiveTimers: updated };
           });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [globalActiveTimers]);

  const handleHUDPauseToggle = async (taskId: string) => {
    const timer = globalActiveTimers.find(t => t.taskId === taskId);
    if (!timer) return;
    try {
      if (timer.isPaused) {
        await api.post('/time-logs/resume', { taskId: timer.taskId, projectId: timer.projectId });
        useStore.getState().updateGlobalActiveTimer(taskId, { isPaused: false });
      } else {
        await api.post('/time-logs/pause', { taskId: timer.taskId });
        useStore.getState().updateGlobalActiveTimer(taskId, { isPaused: true, seconds: localSeconds[taskId] });
      }
    } catch (err) {
      console.error('HUD Timer sync failed:', err);
    }
  };

  const handleHUDStop = async (taskId: string) => {
    try {
      await api.post('/time-logs/stop', { taskId });
      useStore.getState().removeGlobalActiveTimer(taskId);
      // Refresh active view data to update completed counters
      useStore.getState().fetchData();
    } catch (err) {
      console.error('HUD Stop timer failed:', err);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await addProject({
      name: newProjectName,
      description: newProjectDesc,
      status: 'active',
      visibility: 'public',
      priority: 'medium',
      isLocked: false
    });
    setNewProjectName('');
    setNewProjectDesc('');
    setShowProjectModal(false);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const taskBadges: Record<string, number> = {
    board: tasks.filter((t) => t.status === 'stuck').length,
    logs: 0,
    dashboard: 0,
    members: 0,
    analytics: 0,
    tracker: 0,
    calendar: 0,
  };

  return (
    <aside
      ref={sidebarRef}
      className="w-full backdrop-blur-md flex flex-col h-full shrink-0 transition-colors duration-300 relative"
      style={{
        background: 'var(--theme-sidebar-bg)',
        borderRight: '1px solid var(--theme-sidebar-border)',
      }}
    >
      {/* Drag-to-resize handle */}
      <div
        ref={dragHandleRef}
        onMouseDown={handleDragStart}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-indigo-500/20 transition-colors group"
        title="Drag to resize sidebar"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-indigo-500/0 group-hover:bg-indigo-500/40 rounded-full transition-all" />
      </div>
      {/* Top Section: Logo & Projects */}
      <div className="shrink-0">
        {/* Logo */}
        <div
          className="px-4 py-4"
          style={{ borderBottom: '1px solid var(--theme-sidebar-border)' }}
        >
          <LogoCompact />
        </div>

        {/* Project Switcher */}
        <div
          className="p-4 relative"
          style={{ borderBottom: '1px solid var(--theme-sidebar-border)' }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.2em] font-extrabold">Project</p>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all ${showArchived ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/5' : 'text-gray-400'}`}
                title={showArchived ? "Hide Archived" : "Show Archived"}
              >
                <Archive size={11} />
              </button>
            </div>
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
              onClick={() => setShowProjectModal(true)}
              title="Create New Project"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 rounded-xl border border-gray-200/40 dark:border-gray-800/40 transition-all duration-300 group hover:border-indigo-500/30 dark:hover:border-indigo-500/20"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FolderKanban size={16} className="text-indigo-500 dark:text-indigo-400 shrink-0 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                  {formatCamelBack(project.name)}
                </span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProjectDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsProjectDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden animate-dropdown">
                  {/* Search input */}
                  <div className="px-3 pb-2 pt-1.5 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder="Search projects…"
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                    {/* Pinned first */}
                    {projects.filter(p => pinnedProjects.includes(p.id) && p.name.toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                      <div key={p.id} className="flex items-center group/proj">
                        <button
                          onClick={() => { setProject(p); setIsProjectDropdownOpen(false); setProjectSearch(''); }}
                          className={`flex-1 text-left px-4 py-2.5 text-xs font-semibold transition-all flex items-center gap-3 ${
                            project.id === p.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <Pin size={9} className="shrink-0 text-amber-500" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate leading-none">{formatCamelBack(p.name)}</p>
                          </div>
                        </button>
                        <button onClick={() => togglePinProject(p.id)} className="px-2 text-amber-400 hover:text-amber-600" title="Unpin">
                          <Pin size={10} fill="currentColor" />
                        </button>
                      </div>
                    ))}

                    {/* Separator if both pinned and unpinned */}
                    {pinnedProjects.length > 0 && projects.some(p => !pinnedProjects.includes(p.id)) && (
                      <div className="mx-4 my-1 border-t border-gray-100 dark:border-gray-800" />
                    )}

                    {/* Unpinned projects */}
                    {projects.filter(p => !pinnedProjects.includes(p.id) && p.name.toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                      <div key={p.id} className="flex items-center group/proj">
                        <button
                          onClick={() => { setProject(p); setIsProjectDropdownOpen(false); setProjectSearch(''); }}
                          className={`flex-1 text-left px-4 py-2.5 text-xs font-semibold transition-all flex items-center gap-3 ${
                            project.id === p.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <FolderKanban size={12} className={`shrink-0 ${project.id === p.id ? 'text-white' : 'text-indigo-500 dark:text-indigo-400 opacity-85 group-hover/proj:opacity-100 transition-opacity'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="truncate leading-none">{formatCamelBack(p.name)}</p>
                            {p.status === 'archived' && <p className="text-[9px] mt-1 opacity-60">Archived</p>}
                          </div>
                        </button>
                        <button
                          onClick={() => togglePinProject(p.id)}
                          className="px-2 opacity-0 group-hover/proj:opacity-100 text-gray-400 hover:text-amber-400 transition-all"
                          title="Pin project"
                        >
                          <Pin size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <div className="flex items-center gap-3 px-3 mb-4">
          <button
            onClick={toggleSidebar}
            className="p-1.5 -ml-1 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
            title="Collapse Sidebar"
          >
            <Menu size={18} strokeWidth={2.5} />
          </button>
          <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.2em] font-extrabold shrink-0">Workspace</p>
          <div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const badge = taskBadges[item.view];

          return (
            <button
              id={`tour-sidebar-${item.view}`}
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${isActive
                ? 'font-bold shadow-sm border-l-4'
                : 'hover:translate-x-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/20'
              }`}
              style={isActive ? {
                background: 'var(--theme-sidebar-active-bg)',
                color: 'var(--theme-sidebar-active-text)',
                borderLeftColor: item.color,
              } : {
                color: 'var(--theme-sidebar-subtext)',
              }}
            >
              <Icon
                size={18}
                style={{ color: item.color }}
                className={`transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate`}
                  style={{ color: isActive ? 'var(--theme-sidebar-active-text)' : 'var(--theme-sidebar-text)' }}
                >
                  {item.label}
                </p>
              </div>
              {badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'text-white' : 'bg-rose-500 text-white'}`}
                  style={isActive ? { background: 'var(--theme-accent)' } : undefined}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Stats & User */}
      <div
        className="shrink-0 p-3 space-y-3"
        style={{
          borderTop: '1px solid var(--theme-sidebar-border)',
          background: 'var(--theme-sidebar-bg)',
        }}
      >

        {/* Global Active Time Tracker HUDs */}
        {globalActiveTimers.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setIsTimersExpanded(!isTimersExpanded)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Clock size={14} className="text-emerald-500" />
                Active Timers ({globalActiveTimers.length})
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isTimersExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isTimersExpanded && (
              <div className="space-y-2 pl-2">
                {globalActiveTimers.map(timer => (
                  <div key={timer.taskId} className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-3 shadow-md shadow-emerald-500/5 space-y-2 animate-fade-in select-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 bg-emerald-500 rounded-full ${timer.isPaused ? '' : 'animate-ping'}`} />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">
                          {timer.isPaused ? 'Timer Paused' : 'Active Tracking'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatTime(localSeconds[timer.taskId] || timer.seconds)}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate pr-1">
                      {timer.taskTitle}
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleHUDPauseToggle(timer.taskId)}
                        className="flex-1 py-1 px-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        {timer.isPaused ? <Play size={10} className="fill-current text-emerald-500" /> : <Pause size={10} className="fill-current text-amber-500" />}
                        {timer.isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={() => handleHUDStop(timer.taskId)}
                        className="py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        <Square size={10} className="fill-current" />
                        Stop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact Premium Stats Widget */}
        <div className="glass-panel rounded-2xl p-3 relative overflow-hidden group transition-all duration-300 hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10">
          <div className="flex items-center gap-4">
            {/* Circular Progress */}
            <div className="relative shrink-0 w-11 h-11">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="22" cy="22" r="19"
                  className="stroke-gray-100 dark:stroke-gray-800 fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="22" cy="22" r="19"
                  className="fill-none transition-all duration-1000 ease-out"
                  style={{ stroke: 'var(--theme-accent)' }}
                  strokeWidth="3.5"
                  strokeDasharray="119.38"
                  strokeDashoffset={119.38 - (119.38 * completionRate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-gray-900 dark:text-white leading-none">{completionRate}%</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="flex-1 grid grid-cols-4 gap-1 border-l border-gray-100 dark:border-slate-800 pl-3">
              {[
                { label: 'Active', count: tasks.filter(t => t.status === 'in-progress').length, color: 'text-blue-500' },
                { label: 'Stuck', count: tasks.filter(t => t.status === 'stuck').length, color: 'text-rose-500' },
                { label: 'Done', count: completedCount, color: 'text-emerald-500' },
                { label: 'Total', count: tasks.length, color: 'text-indigo-500' },
              ].map(s => (
                <div key={s.label} className="text-center group/item">
                  <p className={`text-[11px] font-black ${s.color} leading-none group-hover/item:scale-110 transition-transform`}>{s.count}</p>
                  <p className="text-[7px] text-gray-400 dark:text-gray-500 uppercase font-black mt-1 tracking-tighter">{s.label.slice(0, 3)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="flex items-center gap-3 px-1">
            <Avatar user={currentUser} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white text-sm font-bold truncate leading-none mb-1">{currentUser.name}</p>
              <div className="flex items-center gap-1 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-extrabold border uppercase tracking-tighter"
                  style={{
                    background: 'var(--theme-accent-muted)',
                    color: 'var(--theme-accent)',
                    borderColor: 'var(--theme-accent-glow)',
                  }}
                >
                  {currentUser.role}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase tracking-widest scale-95 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                    PRO
                  </span>
                )}
                {project.memberDetails?.find(m => m.userId === currentUser.id)?.role === 'TeamLead' && teamLeadEnabled && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-black uppercase tracking-widest scale-95 shadow-[0_0_8px_rgba(99,102,241,0.4)]" title="Team Lead">
                    TL
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
      {/* Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Create New Project" size="sm">
        <form onSubmit={handleCreateProject} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all"
              placeholder="e.g. Product v2.0 Launch"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all resize-none"
              placeholder="Briefly describe what this project is about…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setShowProjectModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" className="flex-1 font-bold" type="submit" disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};
