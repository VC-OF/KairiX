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
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { LogoCompact } from '../ui/Logo';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

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
  const { activeView, setActiveView, currentUser, tasks, project, projects, setProject, addProject, showArchived, setShowArchived } = useStore();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await addProject({ name: newProjectName, description: newProjectDesc, status: 'active' });
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
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-950 flex flex-col h-full shrink-0 border-r border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Top Section: Logo & Projects */}
      <div className="shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800/50">
          <LogoCompact />
        </div>

        {/* Project Switcher */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/30 relative">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black">Project</p>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${showArchived ? 'text-indigo-600' : 'text-gray-400'}`}
                title={showArchived ? "Hide Archived" : "Show Archived"}
              >
                <Archive size={10} />
              </button>
            </div>
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-white transition-colors"
              onClick={() => setShowProjectModal(true)}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 transition-all group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
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
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-30 py-1 overflow-hidden animate-dropdown">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProject(p);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all flex items-center gap-3 ${project.id === p.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${project.id === p.id ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate leading-none">{p.name}</p>
                          {p.status === 'archived' && <p className="text-[9px] mt-0.5 opacity-60">Archived</p>}
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black px-3 mb-3">Workspace</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const badge = taskBadges[item.view];

          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-white'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors'} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-white'}`}>
                  {item.label}
                </p>
              </div>
              {badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                  }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Stats & User (Fixed at bottom) */}
      <div className="shrink-0 p-3 space-y-3 border-t border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-900/50">
        {/* Quick Stats */}
        {/* Compact Premium Stats Widget */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-900/50">
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
            <div className="flex-1 grid grid-cols-4 gap-1 border-l border-gray-100 dark:border-gray-800 pl-3">
              {[
                { label: 'Active', count: tasks.filter(t => t.status === 'in-progress').length, color: 'text-blue-500' },
                { label: 'Stuck', count: tasks.filter(t => t.status === 'stuck').length, color: 'text-rose-500' },
                { label: 'Done', count: completedCount, color: 'text-emerald-500' },
                { label: 'Total', count: tasks.length, color: 'text-indigo-500' },
              ].map(s => (
                <div key={s.label} className="text-center group/item">
                  <p className={`text-[11px] font-black ${s.color} leading-none group-hover/item:scale-110 transition-transform`}>{s.count}</p>
                  <p className="text-[7px] text-gray-400 uppercase font-black mt-1 tracking-tighter">{s.label.slice(0, 3)}</p>
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-tighter">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Create New Project" size="sm">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My New Project"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Project description..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowProjectModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};
