import React, { useEffect, useState } from 'react';
import { Task, useStore } from '../../store/useStore';
import { TaskTimer } from './TaskTimer';
import { ManualLogModal } from './ManualLogModal';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Clock, Edit3, Tag, User, AlignLeft, MessageSquare, Send, Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEdit: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ isOpen, onClose, task, onEdit }) => {
  const { users, currentUser, taskComments, fetchTaskComments, addTaskComment } = useStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showManualLog, setShowManualLog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTaskComments(task.id);
    }
  }, [isOpen, task.id, fetchTaskComments]);

  const assignedUsers = users.filter((u) => task.assignees.includes(u.id));
  const createdByUser = users.find((u) => u.id === task.createdBy);
  const canManageTasks =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'executive' ||
    (currentUser as any)?.projectRole === 'ProjectManager' ||
    (currentUser as any)?.projectRole === 'TeamLead';
  const comments = taskComments[task.id] || [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    await addTaskComment(task.id, newComment);
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800/50 group/id w-fit">
                ID: {task.id.slice(-6).toUpperCase()}
                <button 
                  onClick={() => { navigator.clipboard.writeText(task.id); }}
                  className="opacity-0 group-hover/id:opacity-100 transition-opacity hover:text-indigo-800 dark:hover:text-indigo-300"
                  title="Copy Full Task ID"
                >
                  <Copy size={12} />
                </button>
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{task.title}</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                <AlignLeft size={14} />
                Description
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Daily Progress / Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-500" />
                Daily Progress Updates
              </h4>
              <span className="text-xs text-gray-400 dark:text-gray-500">{comments.length} updates</span>
            </div>

            {/* Comment List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.map((comment) => {
                const author = users.find((u) => u.id === comment.userId);
                return (
                  <div key={comment.id} className="flex gap-3">
                    {author && <Avatar user={author} size="xs" />}
                    <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{author?.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {format(parseISO(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <MessageSquare size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">No progress updates yet. Add your first daily comment below.</p>
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            {task.status !== 'completed' && (
              <form onSubmit={handleAddComment} className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a daily update or progress note..."
                  className="w-full pl-3 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[80px] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Sidebar - Meta Info */}
        <div className="space-y-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-700 lg:pl-6">
          {/* Assignees */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              <User size={12} />
              Assignees
            </div>
            {assignedUsers.length > 0 ? (
              <div className="space-y-3">
                {assignedUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <Avatar user={u} size="xs" />
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{u.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No one assigned</p>
            )}
          </div>

          {/* Time Tracking */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} />
                Time Tracking
              </h4>
              <button 
                onClick={() => setShowManualLog(true)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Add Manual Log
              </button>
            </div>
            
            <TaskTimer 
              taskId={task.id} 
              projectId={(task as any).projectId || useStore.getState().project.id} 
              onTimeUpdate={() => {
                fetchTaskComments(task.id);
                useStore.getState().refreshTask(task.id);
              }} 
            />

            <ManualLogModal 
              isOpen={showManualLog}
              onClose={() => setShowManualLog(false)}
              taskId={task.id}
              projectId={(task as any).projectId || useStore.getState().project.id}
              onSuccess={() => {
                fetchTaskComments(task.id);
                useStore.getState().refreshTask(task.id);
              }}
            />
            
            <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Estimated</span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{task.estimatedHours || 0}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Spent</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{task.actualWorkedHours?.toFixed(1) || 0}h</span>
              </div>
              <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (task.actualWorkedHours / (task.estimatedHours || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                {task.estimatedHours ? `${((task.actualWorkedHours / task.estimatedHours) * 100).toFixed(0)}% of estimation` : 'No estimation set'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            {task.dueDate && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  <Calendar size={12} />
                  Due Date
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-bold">
                  {format(parseISO(task.dueDate), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                <Clock size={12} />
                Created
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                {format(parseISO(task.createdAt), 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                <Tag size={12} />
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-full text-[10px] font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
            {canManageTasks && (
              <Button variant="outline" size="sm" icon={<Edit3 size={14} />} onClick={onEdit} className="w-full">
                Edit Task
              </Button>
            )}
            {createdByUser && (
              <div className="flex items-center gap-2 pt-2">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Owner:</p>
                <div className="flex items-center gap-1.5">
                  <Avatar user={createdByUser} size="xxs" />
                  <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{createdByUser.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
