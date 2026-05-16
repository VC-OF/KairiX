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
            className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.name ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
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
            className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.email ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
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
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
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

export const Members: React.FC = () => {
  const { users, tasks, currentUser, removeUser, project, addMemberToProject } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const projectMembers = users.filter(u => project.members.includes(u.id));
  const otherUsers = users.filter(u => !project.members.includes(u.id));

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
            <Users size={20} className="text-indigo-500" />
            Team Members
          </h2>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-0.5">
            {users.length}/50 members · Managing access and assignments
          </p>
        </div>
        {isAdmin && users.length < 50 && (
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add Member
          </Button>
        )}
      </div>

      {/* Capacity Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Capacity</span>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{users.length} / 50 members</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${users.length >= 50 ? 'bg-rose-500' : users.length >= 40 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
            style={{ width: `${(users.length / 50) * 100}%` }}
          />
        </div>
        {users.length >= 50 && (
          <p className="text-xs text-rose-500 font-medium mt-1">Team is at maximum capacity (50 members)</p>
        )}
      </div>

      {/* Project Members */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1 uppercase tracking-wider">Project Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectMembers.map((user) => {
            const stats = getMemberStats(user.id);
            const isSelf = currentUser?.id === user.id;

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 p-5 border-b border-gray-50 dark:border-gray-700/50">
                  <Avatar user={user} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</h3>
                      {user.role === 'admin' && <Crown size={14} className="text-amber-500 flex-shrink-0" />}
                      {isSelf && (
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail size={12} className="text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${user.role === 'admin'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <ClipboardList size={13} className="text-indigo-400" />
                        <span className="font-bold text-gray-800 dark:text-gray-200">{stats.total}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Tasks</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="font-bold text-gray-800 dark:text-gray-200">{stats.completed}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Done</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <AlertCircle size={13} className="text-rose-400" />
                        <span className="font-bold text-gray-800 dark:text-gray-200">{stats.stuck}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Stuck</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex border-t border-gray-50 dark:border-gray-700/50">
                    <button
                      onClick={() => setEditMember(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors border-l border-gray-50 dark:border-gray-700/50"
                      >
                        <Trash2 size={13} /> Remove
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1 uppercase tracking-wider">Available Team Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-5 flex items-center gap-4 transition-colors"
              >
                <Avatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => addMemberToProject(project.id, user.id)}
                >
                  Add to Project
                </Button>
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
            <strong className="text-gray-900 dark:text-gray-100">{users.find((u) => u.id === confirmDelete)?.name}</strong> from the team?
            They will be unassigned from all tasks.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => { if (confirmDelete) { removeUser(confirmDelete); setConfirmDelete(null); } }}
            >
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
