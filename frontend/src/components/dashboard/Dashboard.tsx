import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Avatar, AvatarGroup } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  TrendingUp,
  Users,
  ClipboardList,
  Zap,
  Edit3,
  BarChart3,
  Archive,
  Plus,
  Sparkles,
  MessageSquare,
  Minus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ProjectHealthScore } from './ProjectHealthScore';
import { WorkloadMap } from './WorkloadMap';

// Skeleton block helper
const Skel = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl ${className}`} />
);

export const colorAccents: Record<string, {
  name: string;
  gradient: string;
  solid: string;
  text: string;
  border: string;
  glow: string;
  ring: string;
}> = {
  indigo: {
    name: 'Indigo Velvet',
    gradient: 'from-indigo-600 to-violet-700',
    solid: 'bg-indigo-600',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    glow: 'shadow-indigo-500/10 dark:shadow-indigo-950/20',
    ring: 'ring-indigo-500',
  },
  emerald: {
    name: 'Emerald Aurora',
    gradient: 'from-emerald-600 to-teal-700',
    solid: 'bg-emerald-600',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10 dark:shadow-emerald-950/20',
    ring: 'ring-emerald-500',
  },
  amber: {
    name: 'Amber Solar',
    gradient: 'from-amber-500 to-orange-600',
    solid: 'bg-amber-600',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/10 dark:shadow-amber-950/20',
    ring: 'ring-amber-500',
  },
  rose: {
    name: 'Rose Quartz',
    gradient: 'from-rose-600 to-pink-700',
    solid: 'bg-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    glow: 'shadow-rose-500/10 dark:shadow-rose-950/20',
    ring: 'ring-rose-500',
  },
  teal: {
    name: 'Teal Lagoon',
    gradient: 'from-teal-600 to-cyan-700',
    solid: 'bg-teal-600',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
    glow: 'shadow-teal-500/10 dark:shadow-teal-950/20',
    ring: 'ring-teal-500',
  },
};

const getAccentBg = (c: string) => {
  switch (c) {
    case 'emerald': return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500';
    case 'amber': return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500';
    case 'rose': return 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500';
    case 'teal': return 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-500';
    default: return 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500';
  }
};

const getAccentBorder = (c: string) => {
  switch (c) {
    case 'emerald': return 'border-b-2 border-emerald-500/70';
    case 'amber': return 'border-b-2 border-amber-500/70';
    case 'rose': return 'border-b-2 border-rose-500/70';
    case 'teal': return 'border-b-2 border-teal-500/70';
    default: return 'border-b-2 border-indigo-500/70';
  }
};

const getAccentText = (c: string) => {
  switch (c) {
    case 'emerald': return 'text-emerald-500';
    case 'amber': return 'text-amber-500';
    case 'rose': return 'text-rose-500';
    case 'teal': return 'text-teal-500';
    default: return 'text-indigo-500';
  }
};

export const Dashboard: React.FC = () => {
  const { 
    project, 
    tasks, 
    users, 
    currentUser, 
    updateProject, 
    setActiveView, 
    dailyLogs, 
    recentTasks: cachedRecentTasks, 
    setSelectedTaskId, 
    projects, 
    globalActiveTimers 
  } = useStore();
  const [editingProject, setEditingProject] = useState(false);
  const [projName, setProjName] = useState(project.name);
  const [projDesc, setProjDesc] = useState(project.description);
  const [projColor, setProjColor] = useState(project.color || 'indigo');

  // Keep state in sync with loaded project
  React.useEffect(() => {
    setProjName(project.name);
    setProjDesc(project.description);
    setProjColor(project.color || 'indigo');
  }, [project]);

  // Show skeleton while project is still the placeholder
  const isLoading = project.id === 'project-1' || (!project.name && tasks.length === 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <div className="rounded-3xl p-6 bg-gray-100 dark:bg-gray-800/60 space-y-3">
          <Skel className="h-4 w-24 rounded-full" />
          <Skel className="h-8 w-64" />
          <Skel className="h-4 w-96 max-w-full" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex justify-between">
                <Skel className="w-10 h-10 rounded-2xl" />
                <Skel className="w-12 h-8" />
              </div>
              <Skel className="h-3 w-20" />
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <Skel className="h-4 w-32" />
            <Skel className="w-36 h-36 rounded-full mx-auto" />
            {[...Array(4)].map((_, i) => <Skel key={i} className="h-3 w-full" />)}
          </div>
          <div className="lg:col-span-2 glass-panel rounded-3xl p-5 space-y-3">
            <Skel className="h-4 w-32" />
            {[...Array(5)].map((_, i) => <Skel key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  const projectMembers = users.filter(u => (project.members || []).includes(u.id));
  const isAdmin = currentUser?.role === 'admin';

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    stuck: tasks.filter((t) => t.status === 'stuck').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const handleSaveProject = () => {
    updateProject({ name: projName, description: projDesc, color: projColor });
    setEditingProject(false);
  };

  const overdueTasksCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  const tasksMentionedCount = dailyLogs.reduce((acc, log) => acc + (log.completedTasks?.length || 0), 0);
  const membersCount = projectMembers.length;
  const workflowUpdatesCount = stats.completed;

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: <ClipboardList size={20} className={getAccentText(project.color || 'indigo')} />,
      colorClass: getAccentBorder(project.color || 'indigo'),
      iconBg: getAccentBg(project.color || 'indigo'),
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: <Clock size={20} className="text-blue-500" />,
      colorClass: 'border-b-2 border-blue-500/70',
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-500',
    },
    {
      label: 'Stuck',
      value: stats.stuck,
      icon: <AlertCircle size={20} className="text-rose-500" />,
      colorClass: 'border-b-2 border-rose-500/70',
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircle2 size={20} className="text-emerald-500" />,
      colorClass: 'border-b-2 border-emerald-500/70',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500',
    },
  ];

  const activeAccent = colorAccents[project.color || 'indigo'] || colorAccents.indigo;

  const recentActivities = [...dailyLogs]
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
    .slice(0, 5);

  const canManageTasks =
    currentUser?.role === 'admin' ||
    (currentUser as any)?.projectRole === 'ProjectManager' ||
    (currentUser as any)?.projectRole === 'TeamLead';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Header - Claude Fable Aesthetic */}
      <div className="bg-[#fdfaf6] dark:bg-[#1f1d1b] rounded-3xl p-8 border border-[#e6e2db] dark:border-[#332f2a] shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 px-2.5 py-1 bg-[#f4eee6] dark:bg-[#2a2622] rounded-full w-fit border border-[#e6e2db] dark:border-[#332f2a]">
              <Zap size={12} className="text-[#d48c46] dark:text-[#e09f58] fill-current" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6e6963] dark:text-[#a19d96]">
                {project.status === 'active' ? 'Active Project' : 'Archived Project'}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-[#2d2926] dark:text-[#edeae5] font-serif">
              {project.name}
            </h1>
            <p className="text-[#6e6963] dark:text-[#a19d96] text-sm leading-relaxed max-w-2xl">
              {project.description}
            </p>
            <div className="flex items-center gap-2 text-[#8b857d] dark:text-[#807b74] text-xs mt-4 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d2cbc0] dark:bg-[#4a453f]" />
              <span>Started {project.createdAt ? format(parseISO(project.createdAt), 'MMMM d, yyyy') : 'Recently'}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-between gap-6 shrink-0 mt-2 md:mt-0">
            <div className="flex gap-2">
              {canManageTasks && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => {
                    sessionStorage.setItem('openAddTaskModal', 'true');
                    setActiveView('board');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all duration-200"
                >
                  Add Task
                </Button>
              )}
              {isAdmin && (
                <>
                  <Button
                    id="tour-edit-project"
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 size={13} />}
                    onClick={() => setEditingProject(true)}
                    className="bg-white dark:bg-[#24211f] hover:bg-[#f4eee6] dark:hover:bg-[#2a2622] text-[#2d2926] dark:text-[#edeae5] border border-[#e6e2db] dark:border-[#332f2a] rounded-xl shadow-sm transition-all duration-200"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Archive size={13} />}
                    onClick={() => updateProject({ status: project.status === 'active' ? 'archived' : 'active' })}
                    className="bg-white dark:bg-[#24211f] hover:bg-[#f4eee6] dark:hover:bg-[#2a2622] text-[#2d2926] dark:text-[#edeae5] border border-[#e6e2db] dark:border-[#332f2a] rounded-xl shadow-sm transition-all duration-200"
                    title={project.status === 'active' ? "Archive Project" : "Unarchive Project"}
                  >
                    {project.status === 'active' ? 'Archive' : 'Restore'}
                  </Button>
                </>
              )}
            </div>
            
            {/* Mini Member Avatars */}
            <div className="flex items-center gap-3 bg-white dark:bg-[#24211f] px-3.5 py-1.5 rounded-2xl border border-[#e6e2db] dark:border-[#332f2a] shadow-sm">
              <AvatarGroup users={projectMembers} max={4} size="sm" />
              <div className="text-left leading-none border-l border-[#e6e2db] dark:border-[#332f2a] pl-2.5">
                <p className="text-xs font-bold text-[#2d2926] dark:text-[#edeae5]">{projectMembers.length}</p>
                <p className="text-[9px] text-[#8b857d] dark:text-[#807b74] font-semibold uppercase tracking-wider mt-0.5">members</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 ${card.colorClass}`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-2xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                {card.icon}
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {card.value}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-3">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Health Score + Workload Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectHealthScore />
        <WorkloadMap />
      </div>

      {/* Progress & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-500">
              <BarChart3 size={16} />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 tracking-tight">Progress Overview</h3>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center my-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" className="stroke-gray-100 dark:stroke-slate-800" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={project.color === 'emerald' ? '#10b981' : project.color === 'amber' ? '#f59e0b' : project.color === 'rose' ? '#f43f5e' : project.color === 'teal' ? '#14b8a6' : '#6366f1'} />
                    <stop offset="100%" stopColor={project.color === 'emerald' ? '#059669' : project.color === 'amber' ? '#d97706' : project.color === 'rose' ? '#db2777' : project.color === 'teal' ? '#0d9488' : '#4f46e5'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {stats.total === 0 ? (
                  <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 leading-tight">
                    No Tasks<br />Allocated
                  </span>
                ) : stats.completed === 0 ? (
                  <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 leading-tight">
                    No Tasks<br />Done Yet
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{completionRate}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mt-0.5">Complete</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-3 mt-4">
            {[
              { label: 'Pending', count: stats.pending, color: 'bg-slate-400 dark:bg-slate-600', total: stats.total },
              { label: 'In Progress', count: stats.inProgress, color: 'bg-blue-500', total: stats.total },
              { label: 'Stuck', count: stats.stuck, color: 'bg-rose-500', total: stats.total },
              { label: 'Completed', count: stats.completed, color: 'bg-emerald-500', total: stats.total },
            ].map((item) => (
              <div key={item.label} className="group/item">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">{item.label}</span>
                  <span className="text-gray-800 dark:text-slate-100 font-bold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md leading-none text-[10px]">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Accessed Tasks (Task Cache) */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                  <TrendingUp size={16} />
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 tracking-tight">Recent Tasks</h3>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setActiveView('board')}
                className="text-xs hover:text-indigo-600 font-bold transition-all text-indigo-500 dark:text-indigo-400"
              >
                View Board →
              </Button>
            </div>
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {cachedRecentTasks.map((task) => {
                const proj = projects.find((p: any) => p.id === task.projectId);
                const isActiveTimer = globalActiveTimers.some(t => t.taskId === task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/10 transition-all duration-300 cursor-pointer group/row"
                    title={`Click to reopen task: ${task.title}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        {isActiveTimer ? (
                          <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                          </span>
                        ) : task.status === 'completed' ? (
                          <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/10" />
                        ) : task.status === 'in-progress' ? (
                          <Clock size={16} className="text-blue-500" />
                        ) : task.status === 'stuck' ? (
                          <AlertCircle size={16} className="text-rose-500 fill-rose-500/10" />
                        ) : (
                          <Circle size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-400 dark:text-gray-500 font-bold">
                          {proj && (
                            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold">
                              {proj.name}
                            </span>
                          )}
                          <span>•</span>
                          <span className="font-medium">
                            {task.lastAccessedAt ? format(parseISO(task.lastAccessedAt), 'MMM d, h:mm a') : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isActiveTimer && (
                      <span className="text-[8px] font-mono font-black text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse tracking-wider shrink-0">
                        RUNNING
                      </span>
                    )}
                  </div>
                );
              })}
              {cachedRecentTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No cached tasks</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Open any task to see it cached here</p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => setActiveView('board')}
                    className="mx-auto"
                  >
                    Go to Board
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Workspace Activity (Operations Audit Feed) */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Zap size={16} />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 tracking-tight font-sans">Recent Activity</h3>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {recentActivities.map((log) => {
              const logAuthor = users.find((u) => u.id === log.userId);
              const initials = logAuthor
                ? logAuthor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : '??';
              const name = logAuthor ? logAuthor.name : 'Unknown User';
              const color = logAuthor ? logAuthor.color : '#6366f1';
              
              const formatLogTime = (dateStr: string) => {
                try {
                  return format(parseISO(dateStr), 'MMM d, h:mm a');
                } catch (e) {
                  return 'Recently';
                }
              };

              return (
                <div key={log.id} className="flex gap-3 text-xs animate-fade-in-slide border-b border-gray-50 dark:border-gray-800/40 pb-3 last:border-0 last:pb-0">
                  <div 
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-extrabold flex-shrink-0 text-[10px] shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                      {name} <span className="font-medium text-gray-500 dark:text-gray-400">posted a progress update</span>
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-1 line-clamp-2 italic">
                      "{log.content}"
                    </p>
                    {log.blockers && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded text-[9px] font-semibold text-rose-600 dark:text-rose-400">
                        Blocker: {log.blockers}
                      </span>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">{formatLogTime(log.createdAt || log.date)}</p>
                  </div>
                </div>
              );
            })}

            {recentActivities.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No activity logged yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Post status updates in the Daily Logs feed</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveView('logs')}
                  className="mx-auto"
                >
                  Go to Daily Logs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Users size={16} />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 tracking-tight">Team Members</h3>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setActiveView('members')} className="font-bold hover:text-indigo-600 transition-all">
            Manage →
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {projectMembers.map((user) => {
            const userTaskCount = tasks.filter((t) => t.assignees.includes(user.id)).length;
            const userCompletedCount = tasks.filter(
              (t) => t.assignees.includes(user.id) && t.status === 'completed'
            ).length;
            return (
              <div key={user.id} className="flex flex-col items-center p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/30 dark:border-gray-800/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 hover:border-indigo-500/15 dark:hover:border-indigo-500/10 transition-all duration-300">
                <Avatar user={user} size="md" />
                <p className="mt-2 text-sm font-bold text-gray-800 dark:text-slate-100 text-center truncate w-full">
                  {user.name.split(' ')[0]}
                </p>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide leading-none ${user.role === 'admin' ? 'bg-indigo-100/60 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900/50' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-transparent'
                  }`}>
                  {user.role}
                </span>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2">
                  {userCompletedCount}/{userTaskCount} tasks
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Project Modal */}
      <Modal isOpen={editingProject} onClose={() => setEditingProject(false)} title="Edit Project" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Project Name</label>
            <input
              type="text"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5">
              Project Brand Accent Color
            </label>
            <div className="flex gap-2.5">
              {Object.entries(colorAccents).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProjColor(key)}
                  className={`w-9 h-9 rounded-full ${value.solid} flex items-center justify-center cursor-pointer transition-all duration-200 border-2 hover:scale-110 active:scale-95 ${
                    projColor === key 
                      ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-indigo-500 shadow-md' 
                      : 'border-transparent'
                  }`}
                  title={value.name}
                >
                  {projColor === key && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-405 font-semibold mt-2">
              Selected accent themes all workspace headers, progress meters, and dashboard indicators dynamically.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingProject(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveProject}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
