import React, { useEffect, useState, useCallback } from 'react';
import { Task, useStore } from '../../store/useStore';
import { TaskTimer } from './TaskTimer';
import { ManualLogModal } from './ManualLogModal';
import { Avatar } from '../ui/Avatar';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Clock, Edit3, Tag, User, AlignLeft, MessageSquare, Send, Copy, X, CheckSquare, Square as SquareIcon, Bell, BellOff, Plus, Trash2, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { api } from '../../utils/api';
import { useToast } from '../ui/Toast';

interface TaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEdit: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ isOpen, onClose, task, onEdit }) => {
  const { users, currentUser, taskComments, fetchTaskComments, addTaskComment, project } = useStore();
  const [newComment, setNewComment] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showManualLog, setShowManualLog] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [watching, setWatching] = useState((task.watchers || []).includes(currentUser?.id || ''));
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(task.recurrence?.enabled ?? false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily'|'weekly'|'monthly'>(task.recurrence?.frequency || 'weekly');
  const toast = useToast();

  useEffect(() => { if (isOpen) { fetchTaskComments(task.id); setSubtasks(task.subtasks || []); } }, [isOpen, task.id, fetchTaskComments, task.subtasks]);

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || addingSubtask) return;
    setAddingSubtask(true);
    try {
      const res = await api.post(`/tasks/${project.id}/${task.id}/subtasks`, { title: newSubtask.trim().slice(0, 200) });
      setSubtasks(prev => [...prev, res.data]);
      setNewSubtask('');
      toast.success('Subtask added');
    } catch { toast.error('Failed to add subtask'); }
    setAddingSubtask(false);
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await api.put(`/tasks/${project.id}/${task.id}/subtasks/${subtaskId}`, { completed: !completed });
      setSubtasks(prev => prev.map(s => s._id === subtaskId || s.id === subtaskId ? { ...s, completed: !completed } : s));
    } catch { toast.error('Failed to update subtask'); }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await api.delete(`/tasks/${project.id}/${task.id}/subtasks/${subtaskId}`);
      setSubtasks(prev => prev.filter(s => (s._id || s.id) !== subtaskId));
      toast.success('Subtask removed');
    } catch { toast.error('Failed to delete subtask'); }
  };

  const handleWatchToggle = async () => {
    try {
      if (watching) {
        await api.delete(`/tasks/${project.id}/${task.id}/watch`);
        setWatching(false);
        toast.info('Unwatched task', 'You will no longer receive notifications for this task');
      } else {
        await api.post(`/tasks/${project.id}/${task.id}/watch`);
        setWatching(true);
        toast.success('Now watching task', 'You will receive notifications when this task is updated');
      }
    } catch { toast.error('Failed to update watch status'); }
  };

  const handleSaveRecurrence = async () => {
    try {
      await api.put(`/tasks/${project.id}/${task.id}`, {
        recurrence: {
          enabled: recurrenceEnabled,
          frequency: recurrenceFreq,
          nextDue: recurrenceEnabled ? new Date(Date.now() + (recurrenceFreq === 'daily' ? 86400000 : recurrenceFreq === 'weekly' ? 604800000 : 2592000000)) : null,
        }
      });
      toast.success('Recurrence saved');
    } catch { toast.error('Failed to save recurrence'); }
  };

  const assignedUsers = users.filter((u) => task.assignees.includes(u.id));
  const createdByUser = users.find((u) => u.id === task.createdBy);
  const canManageTasks =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'executive' ||
    (currentUser as any)?.projectRole === 'ProjectManager' ||
    (currentUser as any)?.projectRole === 'TeamLead';
  const canEditTask =
    canManageTasks ||
    (task.assignees || []).includes(currentUser?.id || '');
  const comments = taskComments[task.id] || [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    await addTaskComment(task.id, newComment);
    setNewComment('');
    setSubmitting(false);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    
    // Replace @today with today's date
    if (val.includes('@today')) {
      const todayStr = format(new Date(), 'MMM d, yyyy');
      val = val.replace(/@today\b/g, todayStr);
    }
    
    // Detect @date
    if (val.includes('@date')) {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
    }
    
    setNewComment(val);
  };

  const handleDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (!selectedDate) {
      setShowDatePicker(false);
      return;
    }
    
    const formattedDate = format(parseISO(selectedDate), 'MMM d, yyyy');
    setNewComment(prev => prev.replace(/@date\b/g, formattedDate));
    setShowDatePicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark Glass Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2.5px] transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sliding Right-side Drawer Sheet */}
      <div id="tour-task-detail-sheet" className="relative w-full max-w-4xl bg-white dark:bg-[#0a0d16] border-l border-gray-100 dark:border-gray-850 shadow-2xl h-full flex flex-col overflow-y-auto custom-scrollbar animate-slide-in-right z-10 p-6 lg:p-8 text-gray-900 dark:text-gray-100">
        
        {/* Absolute Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close panel"
        >
          <X size={20} />
        </button>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md flex items-center gap-1.5 border border-indigo-100/50 dark:border-indigo-850 group/id w-fit">
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{task.title}</h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>

            {/* Subtask Checklist */}
            <div className="bg-gray-50/50 dark:bg-gray-900/55 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                  <CheckSquare size={14} className="text-indigo-500" />
                  Checklist
                  {subtasks.length > 0 && (
                    <span className="text-[10px] font-black text-gray-400">{subtasks.filter(s => s.completed).length}/{subtasks.length}</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Subtask items */}
              <div className="space-y-1">
                {subtasks.map(s => {
                  const sid = s._id || s.id;
                  return (
                    <div key={sid} className="flex items-center gap-2.5 group/sub py-1">
                      <button onClick={() => handleToggleSubtask(sid, s.completed)} className="shrink-0 text-gray-400 hover:text-indigo-500 transition-colors">
                        {s.completed ? <CheckSquare size={15} className="text-indigo-500" /> : <SquareIcon size={15} />}
                      </button>
                      <span className={`flex-1 text-xs ${s.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{s.title}</span>
                      {canManageTasks && (
                        <button onClick={() => handleDeleteSubtask(sid)} className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-rose-400 transition-all">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add subtask input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value.slice(0, 200))}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a checklist item..."
                  className="flex-1 text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 focus:outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                  maxLength={200}
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim() || addingSubtask}
                  className="shrink-0 p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="bg-gray-50/50 dark:bg-gray-900/55 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
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
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
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
                    <div key={comment.id} className="flex gap-3 animate-fade-in-slide">
                      {author && <Avatar user={author} size="xs" />}
                      <div className="flex-1 bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-sm transition-colors">
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
                  {showDatePicker && (
                    <div className="absolute left-3 bottom-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-xl z-20 animate-fade-in flex items-center gap-2">
                      <Calendar size={14} className="text-indigo-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Pick date:</span>
                      <input 
                        type="date"
                        onChange={handleDatePicked}
                        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Add a daily update or progress note... (Type @today or @date)"
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
          <div className="space-y-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-6">
            {/* Watch Button */}
            <button
              onClick={handleWatchToggle}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${
                watching
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-200 hover:text-indigo-500'
              }`}
            >
              {watching ? <Bell size={13} /> : <BellOff size={13} />}
              {watching ? 'Watching' : 'Watch Task'}
            </button>

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
                  <p className="text-xs text-gray-800 dark:text-gray-250 font-bold">
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

            {/* Recurrence */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                <RefreshCw size={12} />
                Recurrence
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurrenceEnabled}
                    onChange={e => setRecurrenceEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Enable recurrence</span>
                </label>
                {recurrenceEnabled && (
                  <select
                    value={recurrenceFreq}
                    onChange={e => setRecurrenceFreq(e.target.value as any)}
                    className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
                <button
                  onClick={handleSaveRecurrence}
                  className="w-full py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors"
                >
                  Save Recurrence
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              {canEditTask && (
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
      </div>
    </div>
  );
};
