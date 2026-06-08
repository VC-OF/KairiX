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
} from 'lucide-react';
import { LogoCompact } from '../ui/Logo';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../utils/api';

const navItems = [
  {
    view: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & stats',
  },
  {
    view: 'board' as const,
    label: 'Kanban Board',
    icon: Kanban,
    description: 'Task management',
  },
  {
    view: 'dependency' as const,
    label: 'Dependency Map',
    icon: Network,
    description: 'Interactive graph',
  },
  {
    view: 'calendar' as const,
    label: 'Calendar View',
    icon: Calendar,
    description: 'Work hours calendar',
  },
  {
    view: 'analytics' as const,
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Productivity stats',
  },
  {
    view: 'logs' as const,
    label: 'Daily Logs',
    icon: BookOpen,
    description: 'Status updates',
  },
  {
    view: 'tracker' as const,
    label: 'Time Tracker',
    icon: Clock,
    description: 'Track task time',
  },
  {
    view: 'members' as const,
    label: 'Team Members',
    icon: Users,
    description: 'Manage team',
  },
  {
    view: 'files' as const,
    label: 'Files & Docs',
    icon: FileText,
    description: 'Project documents',
  },
  {
    view: 'profile' as const,
    label: 'My Profile',
    icon: User,
    description: 'Account settings',
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
    globalActiveTimer,
    setGlobalActiveTimer
  } = useStore();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const [seconds, setSeconds] = useState(0);

  // Synchronize local timer seconds when store updates
  useEffect(() => {
    if (globalActiveTimer) {
      setSeconds(globalActiveTimer.seconds);
    }
  }, [globalActiveTimer?.taskId, globalActiveTimer?.isPaused]);

  // Tick seconds every second
  useEffect(() => {
    if (!globalActiveTimer || globalActiveTimer.isPaused) return;

    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        // Keep Zustand store seconds in sync occasionally
        if (next % 5 === 0) {
          useStore.setState((state) => {
            if (state.globalActiveTimer) {
              return {
                globalActiveTimer: {
                  ...state.globalActiveTimer,
                  seconds: next,
                }
              };
            }
            return state;
          });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [globalActiveTimer?.taskId, globalActiveTimer?.isPaused]);

  const handleHUDPauseToggle = async () => {
    if (!globalActiveTimer) return;
    try {
      if (globalActiveTimer.isPaused) {
        await api.post('/time-logs/resume', { taskId: globalActiveTimer.taskId, projectId: globalActiveTimer.projectId });
        setGlobalActiveTimer({ ...globalActiveTimer, isPaused: false });
      } else {
        await api.post('/time-logs/pause', { taskId: globalActiveTimer.taskId });
        setGlobalActiveTimer({ ...globalActiveTimer, isPaused: true, seconds });
      }
    } catch (err) {
      console.error('HUD Timer sync failed:', err);
    }
  };

  const handleHUDStop = async () => {
    if (!globalActiveTimer) return;
    try {
      await api.post('/time-logs/stop', { taskId: globalActiveTimer.taskId });
      setGlobalActiveTimer(null);
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
    <aside className="w-64 bg-white/90 dark:bg-obsidian-900/90 backdrop-blur-md flex flex-col h-full shrink-0 border-r border-gray-200/50 dark:border-gray-800/40 transition-colors duration-300">
      {/* Top Section: Logo & Projects */}
      <div className="shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-200/40 dark:border-gray-800/30">
          <LogoCompact />
        </div>

        {/* Project Switcher */}
        <div className="p-4 border-b border-gray-200/40 dark:border-gray-800/30 relative">
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
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)] glow-dot-indigo" />
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                  {project.name}
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
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProject(p);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all flex items-center gap-3 ${project.id === p.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60'
                          }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${project.id === p.id ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate leading-none">{p.name}</p>
                          {p.status === 'archived' && <p className="text-[9px] mt-1 opacity-60">Archived</p>}
                        </div>
                      </button>
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
        <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.2em] font-extrabold px-3 mb-3">Workspace</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const badge = taskBadges[item.view];

          return (
            <button
              id={`tour-sidebar-${item.view}`}
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 group ${isActive
                ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/5 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500 font-bold shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 hover:text-indigo-600 dark:hover:text-white hover:translate-x-0.5'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors'} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-white'}`}>
                  {item.label}
                </p>
              </div>
              {badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'bg-rose-500 text-white'
                  }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Stats & User */}
      <div className="shrink-0 p-3 space-y-3 border-t border-gray-200/40 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/40">

        {/* Global Active Time Tracker HUD */}
        {globalActiveTimer && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-3 shadow-md shadow-emerald-500/5 space-y-2 animate-fade-in select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 bg-emerald-500 rounded-full ${globalActiveTimer.isPaused ? '' : 'animate-ping'}`} />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">
                  {globalActiveTimer.isPaused ? 'Timer Paused' : 'Active Tracking'}
                </span>
              </div>
              <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                {formatTime(seconds)}
              </span>
            </div>

            <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate pr-1">
              {globalActiveTimer.taskTitle}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleHUDPauseToggle}
                className="flex-1 py-1 px-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                {globalActiveTimer.isPaused ? <Play size={10} className="fill-current text-emerald-500" /> : <Pause size={10} className="fill-current text-amber-500" />}
                {globalActiveTimer.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleHUDStop}
                className="py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Square size={10} className="fill-current" />
                Stop
              </button>
            </div>
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
                  className="stroke-indigo-500 fill-none transition-all duration-1000 ease-out"
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
              <div className="flex items-center gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-100/60 dark:border-indigo-800/40 uppercase tracking-tighter">
                  {currentUser.role}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase tracking-widest scale-95 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                    PRO
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
