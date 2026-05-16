import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Avatar, AvatarGroup } from '../ui/Avatar';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
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
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { project, tasks, users, currentUser, updateProject, setActiveView } = useStore();
  const [editingProject, setEditingProject] = useState(false);
  const [projName, setProjName] = useState(project.name);
  const [projDesc, setProjDesc] = useState(project.description);

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
    updateProject({ name: projName, description: projDesc });
    setEditingProject(false);
  };

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: <ClipboardList size={20} />,
      bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      text: 'text-white',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: <Clock size={20} />,
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: 'text-white',
    },
    {
      label: 'Stuck',
      value: stats.stuck,
      icon: <AlertCircle size={20} />,
      bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
      text: 'text-white',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircle2 size={20} />,
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      text: 'text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-16 translate-y-16" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-indigo-200" />
                <span className="text-indigo-200 text-xs font-medium uppercase tracking-widest">
                  {project.status === 'active' ? 'Active Project' : 'Archived Project'}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
              <p className="text-indigo-200 text-sm leading-relaxed max-w-xl">{project.description}</p>
              <p className="text-indigo-300 text-xs mt-2">
                Started {project.createdAt ? format(parseISO(project.createdAt), 'MMMM d, yyyy') : 'Recently'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 size={14} />}
                    onClick={() => setEditingProject(true)}
                    className="text-white hover:bg-white/10 border border-white/20"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Archive size={14} />}
                    onClick={() => updateProject({ status: project.status === 'active' ? 'archived' : 'active' })}
                    className="text-white hover:bg-white/10 border border-white/20"
                    title={project.status === 'active' ? "Archive Project" : "Unarchive Project"}
                  >
                    {project.status === 'active' ? 'Archive' : 'Restore'}
                  </Button>
                </div>
              )}
              {/* Mini Member Avatars */}
              <div className="flex flex-col items-end gap-1">
                <AvatarGroup users={projectMembers} max={5} size="sm" />
                <span className="text-indigo-300 text-xs">{projectMembers.length} members</span>
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
            className={`${card.bg} rounded-2xl p-4 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-xl">
                {card.icon}
              </div>
              <span className="text-3xl font-bold">{card.value}</span>
            </div>
            <p className="text-sm font-medium opacity-90">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Progress & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Progress Overview</h3>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center my-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{completionRate}%</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Complete</span>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2.5">
            {[
              { label: 'Pending', count: stats.pending, color: 'bg-slate-400', total: stats.total },
              { label: 'In Progress', count: stats.inProgress, color: 'bg-blue-500', total: stats.total },
              { label: 'Stuck', count: stats.stuck, color: 'bg-rose-500', total: stats.total },
              { label: 'Completed', count: stats.completed, color: 'bg-emerald-500', total: stats.total },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 dark:text-gray-200 font-semibold">{item.label}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-bold">{item.count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Recent Tasks</h3>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setActiveView('board')}
            >
              View Board →
            </Button>
          </div>
          <div className="space-y-2">
            {recentTasks.map((task) => {
              const assignedUsers = users.filter((u) => task.assignees.includes(u.id));
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-default"
                >
                  <div className="flex-shrink-0">
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : task.status === 'in-progress' ? (
                      <Clock size={16} className="text-blue-500" />
                    ) : task.status === 'stuck' ? (
                      <AlertCircle size={16} className="text-rose-500" />
                    ) : (
                      <Circle size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{task.title}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Updated {task.updatedAt ? format(parseISO(task.updatedAt), 'MMM d, h:mm a') : 'Recently'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    <div className="flex -space-x-1.5">
                      {assignedUsers.slice(0, 3).map((u) => (
                        <Avatar key={u.id} user={u} size="xs" showTooltip />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {recentTasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tasks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Team Members</h3>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setActiveView('members')}>
            Manage →
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {projectMembers.map((user) => {
            const userTaskCount = tasks.filter((t) => t.assignees.includes(user.id)).length;
            const userCompletedCount = tasks.filter(
              (t) => t.assignees.includes(user.id) && t.status === 'completed'
            ).length;
            return (
              <div key={user.id} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Avatar user={user} size="md" />
                <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100 text-center truncate w-full">
                  {user.name.split(' ')[0]}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 font-medium ${user.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                  {user.role}
                </span>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-300 mt-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
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
