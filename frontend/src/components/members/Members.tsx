import React, { useState } from 'react';
import { useStore, User, UserRole } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Plus,
  Trash2,
  Edit3,
  Crown,
  Users,
  Mail,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
} from 'lucide-react';


const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  '#f97316', '#84cc16',
];

const getInitials = (name: string) => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  member?: User;
}

const MemberForm: React.FC<MemberFormProps> = ({ isOpen, onClose, member }) => {
  const { addUser, updateUser, users } = useStore();
  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [role, setRole] = useState<UserRole>(member?.role || 'member');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!member;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!isEdit && users.length >= 50) errs.general = 'Maximum 50 team members allowed';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const initials = getInitials(name);
    if (isEdit) {
      updateUser(member.id, { name, email, role, avatar: initials });
    } else {
      addUser({ name, email, role, avatar: initials, color: AVATAR_COLORS[users.length % AVATAR_COLORS.length] });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Member' : 'Add Team Member'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Smith"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${errors.name ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
              }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane@company.com"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${errors.email ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
              }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <div className="grid grid-cols-2 gap-3">
            {(['admin', 'member'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === r
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                {r === 'admin' ? <Crown size={16} className="text-amber-500" /> : <Users size={16} />}
                <div className="text-left">
                  <p className="text-sm font-semibold capitalize">{r}</p>
                  <p className="text-xs opacity-70">
                    {r === 'admin' ? 'Full access' : 'Task updates'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">
            {isEdit ? 'Save Changes' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Role config with colors
const ROLE_CONFIG = {
  ProjectManager: {
    label: 'Project Manager',
    gradient: 'from-violet-600 to-fuchsia-600',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    text: 'text-violet-500 dark:text-violet-400',
    border: 'border-violet-500/30',
    glow: 'shadow-[0_0_14px_rgba(139,92,246,0.25)]',
    icon: <Shield size={11} />,
  },
  TeamLead: {
    label: 'Team Lead',
    gradient: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/10 dark:bg-pink-500/20',
    text: 'text-pink-500 dark:text-pink-400',
    border: 'border-pink-500/30',
    glow: 'shadow-[0_0_14px_rgba(236,72,153,0.25)]',
    icon: <Zap size={11} />,
  },
  TeamMember: {
    label: 'Team Member',
    gradient: 'from-sky-500 to-cyan-500',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-500 dark:text-sky-400',
    border: 'border-sky-500/30',
    glow: '',
    icon: <Users size={11} />,
  },
};

export const Members: React.FC = () => {
  const {
    users,
    tasks,
    currentUser,
    project,
    addMemberToProject,
    teamLeadEnabled,
    setTeamLeadEnabled,
    updateProjectMemberRole,
    removeMemberFromProject
  } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showEmailUserId, setShowEmailUserId] = useState<Record<string, boolean>>({});

  const toggleEmail = (userId: string) => {
    setShowEmailUserId(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const isAdmin = currentUser?.role === 'admin';
  const projectMembers = users.filter(u => project.members.includes(u.id));
  const otherUsers = users.filter(u => !project.members.includes(u.id));

  const getProjectRole = (userId: string) => {
    const member = project.memberDetails?.find(m => m.userId === userId);
    return member ? member.role : 'TeamMember';
  };

  const getMemberStats = (userId: string) => {
    const userTasks = tasks.filter((t) => t.assignees.includes(userId));
    return {
      total: userTasks.length,
      completed: userTasks.filter((t) => t.status === 'completed').length,
      inProgress: userTasks.filter((t) => t.status === 'in-progress').length,
      stuck: userTasks.filter((t) => t.status === 'stuck').length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Users size={16} className="text-white" />
            </div>
            Team Members
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5 pl-10">
            {users.length}/50 members · Managing access and assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2.5 bg-white dark:bg-[#0f1623] px-3.5 py-2 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm transition-colors">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Team Leads</span>
              <button
                type="button"
                onClick={() => setTeamLeadEnabled(!teamLeadEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none ${
                  teamLeadEnabled
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${
                    teamLeadEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
          {isAdmin && users.length < 50 && (
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-4 transition-colors">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Team Capacity</span>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{users.length} / 50 members</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              users.length >= 50
                ? 'bg-gradient-to-r from-rose-500 to-red-600'
                : users.length >= 40
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500'
            }`}
            style={{ width: `${(users.length / 50) * 100}%` }}
          />
        </div>
        {users.length >= 50 && (
          <p className="text-xs text-rose-500 font-medium mt-1.5">Team is at maximum capacity (50 members)</p>
        )}
      </div>

      {/* Project Members */}
      <div>
        <h3 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 mb-3 px-1 uppercase tracking-widest">
          Project Members
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectMembers.map((user) => {
            const stats = getMemberStats(user.id);
            const isSelf = currentUser?.id === user.id;
            const projRole = getProjectRole(user.id);
            const roleConf = ROLE_CONFIG[projRole as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.TeamMember;
            const isActive = user.name.toLowerCase().includes('jane') || user.name.toLowerCase().includes('john') || user.role === 'admin';

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-500/20 dark:hover:border-violet-500/20 transition-all duration-300 group"
              >
                {/* Gradient accent bar at top */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${roleConf.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />

                {/* Card Header */}
                <div className="flex items-center gap-4 p-5 border-b border-gray-50 dark:border-white/5">
                  <div 
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggleEmail(user.id)}
                    title="Click to toggle email"
                  >
                    <div className="relative">
                      <Avatar user={user} size="lg" />
                      {isActive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0f1623] rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</h3>
                        {user.role === 'admin' && (
                          <Crown size={13} className="text-amber-400 flex-shrink-0 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                        )}
                        {projRole === 'TeamLead' && teamLeadEnabled && (
                          <span
                            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center justify-center shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                            title="Team Lead"
                          >
                            TL
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-bold border border-violet-200 dark:border-violet-500/20">
                            You
                          </span>
                        )}
                      </div>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ${
                          showEmailUserId[user.id] 
                            ? 'max-h-10 opacity-100 mt-1' 
                            : 'max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 group-hover:mt-1'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Mail size={11} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role selector / badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin ? (
                      <select
                        value={projRole}
                        onChange={(e) => updateProjectMemberRole(project.id, user.id, e.target.value as any)}
                        className={`text-xs border rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer appearance-none pr-6 ${roleConf.bg} ${roleConf.text} ${roleConf.border} ${roleConf.glow} dark:bg-[#181f2e]`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 6px center',
                        }}
                      >
                        <option value="ProjectManager">Project Manager</option>
                        <option value="TeamLead">Team Lead</option>
                        <option value="TeamMember">Team Member</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${roleConf.bg} ${roleConf.text} border ${roleConf.border}`}>
                        {roleConf.icon}
                        {roleConf.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Activity HUD */}
                <div className={`mx-4 my-3 p-3 rounded-xl flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15'
                    : 'bg-gray-50/50 dark:bg-white/3 border border-gray-100 dark:border-white/5'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-gray-400'
                    }`} />
                    <div className="min-w-0 leading-tight">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {user.name.toLowerCase().includes('jane') ? 'Working on guided onboarding tour' :
                         user.name.toLowerCase().includes('john') ? 'Developing multiplayer sockets' :
                         user.role === 'admin' ? 'Active: Global Timer Tracking' : 'Idle: Reviewing code reviews'}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate mt-0.5">
                        {user.name.toLowerCase().includes('jane') ? 'TourGuide.tsx' :
                         user.name.toLowerCase().includes('john') ? 'socket.ts' :
                         user.role === 'admin' ? 'GlobalTimeTracker.tsx' : 'System standby'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/8'
                  }`}>
                    {isActive ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>

                {/* Stats */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-100 dark:border-indigo-500/15">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <ClipboardList size={12} className="text-indigo-500" />
                        <span className="font-extrabold text-gray-800 dark:text-gray-200 text-sm">{stats.total}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Tasks</p>
                    </div>
                    <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-100 dark:border-emerald-500/15">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="font-extrabold text-gray-800 dark:text-gray-200 text-sm">{stats.completed}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Done</p>
                    </div>
                    <div className="text-center p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/8 border border-rose-100 dark:border-rose-500/15">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <AlertCircle size={12} className="text-rose-500" />
                        <span className="font-extrabold text-gray-800 dark:text-gray-200 text-sm">{stats.stuck}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Stuck</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex border-t border-gray-50 dark:border-white/5">
                    <button
                      onClick={() => setEditMember(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors border-l border-gray-50 dark:border-white/5"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Users (Not in current project) */}
      {isAdmin && otherUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 mb-3 px-1 uppercase tracking-widest">
            Available Team Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden p-5 flex items-center gap-4 hover:border-violet-500/20 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300 group"
              >
                <div 
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer select-none"
                  onClick={() => toggleEmail(user.id)}
                  title="Click to toggle email"
                >
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.name}</h3>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ${
                        showEmailUserId[user.id] 
                          ? 'max-h-10 opacity-100 mt-1' 
                          : 'max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 group-hover:mt-1'
                      }`}
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <select
                      id={`add-role-${user.id}`}
                      defaultValue="TeamMember"
                      className="text-xs bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/30 rounded-xl px-2.5 py-1.5 font-bold text-violet-600 dark:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
                    >
                      <option value="TeamMember">Member</option>
                      <option value="TeamLead">Team Lead</option>
                      <option value="ProjectManager">Manager</option>
                    </select>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      const roleSelect = document.getElementById(`add-role-${user.id}`) as HTMLSelectElement | null;
                      const chosenRole = roleSelect ? roleSelect.value : 'TeamMember';
                      addMemberToProject(project.id, user.id, chosenRole);
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && <MemberForm isOpen={showAdd} onClose={() => setShowAdd(false)} />}

      {/* Edit Member Modal */}
      {editMember && (
        <MemberForm isOpen={!!editMember} onClose={() => setEditMember(null)} member={editMember} />
      )}

      {/* Confirm Delete */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to remove{' '}
            <strong className="text-gray-900 dark:text-gray-100">{users.find((u) => u.id === confirmDelete)?.name}</strong> from the project?
            They will be unassigned from all project tasks.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => { if (confirmDelete) { removeMemberFromProject(project.id, confirmDelete); setConfirmDelete(null); } }}
            >
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
