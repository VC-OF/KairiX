import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, useStore } from '../../store/useStore';
import { AvatarGroup } from '../ui/Avatar';
import { TaskForm } from './TaskForm';
import { TaskDetail } from './TaskDetail';
import {
  MoreVertical,
  GripVertical,
  Calendar,
  Trash2,
  Edit3,
  Eye,
  MessageSquare,
  Copy,
} from 'lucide-react';
import { format, isAfter, parseISO, differenceInDays } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

const priorityConfig = {
  low: {
    border: 'border-l-slate-300 dark:border-l-slate-600',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
    label: 'Low',
  },
  medium: {
    border: 'border-l-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-400',
    label: 'Medium',
  },
  high: {
    border: 'border-l-rose-500',
    badge: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    label: 'High',
  },
};

// const statusIcon = {
//   pending: <Circle size={11} className="text-slate-400" />,
//   'in-progress': <Clock size={11} className="text-blue-500" />,
//   stuck: <AlertCircle size={11} className="text-rose-500" />,
//   completed: <CheckCircle2 size={11} className="text-emerald-500" />,
// };

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { users, deleteTask, currentUser, taskComments } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedUsers = users.filter((u) => (task.assignees || []).includes(u.id));
  // Allow admin globally, or ProjectManager/TeamLead at project level
  const canManageTasks =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'executive' ||
    (currentUser as any)?.projectRole === 'ProjectManager' ||
    (currentUser as any)?.projectRole === 'TeamLead';
  const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
  const commentCount = (taskComments?.[task.id] || []).length;

  const isOverdue =
    task.dueDate &&
    task.status !== 'completed' &&
    isAfter(new Date(), parseISO(task.dueDate));

  const daysUntilDue = task.dueDate
    ? differenceInDays(parseISO(task.dueDate), new Date())
    : null;

  const dueDateColor =
    isOverdue
      ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
      : daysUntilDue !== null && daysUntilDue <= 2
        ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
        : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          relative bg-white dark:bg-gray-800
          rounded-xl border border-gray-100 dark:border-gray-700/80
          border-l-4 ${pCfg.border}
          shadow-sm hover:shadow-md
          transition-all duration-200
          ${isDragging ? 'opacity-40 shadow-2xl rotate-1 scale-105' : 'opacity-100'}
          group cursor-pointer select-none
        `}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-click]')) return;
          setShowDetail(true);
        }}
      >
        {/* Top accent line for high priority */}
        {task.priority === 'high' && (
          <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-rose-400 to-transparent rounded-b-full opacity-60" />
        )}

        <div className="p-3.5">
          {/* Header Row */}
          <div className="flex items-start gap-1.5 mb-2.5">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              data-no-click
              className="mt-0.5 flex-shrink-0 text-gray-200 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={15} />
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-indigo-100 dark:border-indigo-800/50 group/id w-fit">
                  {task.id.slice(-6).toUpperCase()}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(task.id);
                    }}
                    className="opacity-0 group-hover/id:opacity-100 transition-opacity hover:text-indigo-800 dark:hover:text-indigo-300"
                    title="Copy Full Task ID"
                  >
                    <Copy size={9} />
                  </button>
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                {task.title}
              </h3>
            </div>

            {/* Menu */}
            <div className="relative flex-shrink-0 ml-1" data-no-click>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all opacity-50 group-hover:opacity-100"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-7 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-30 py-1 min-w-[148px] animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDetail(true); setShowMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Eye size={12} className="text-indigo-400" /> View Details
                  </button>
                  {canManageTasks && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowEdit(true); setShowMenu(false); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Edit3 size={12} className="text-blue-400" /> Edit Task
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); setShowMenu(false); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2 leading-relaxed pl-5">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {(task.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 pl-5">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 rounded-full text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full text-[10px]">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-50 dark:border-gray-700/50 mb-2.5" />

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pl-5">
            {/* Left: priority + due date */}
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {/* Priority pill */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                {pCfg.label}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${dueDateColor}`}>
                  <Calendar size={9} />
                  {isOverdue ? 'Overdue · ' : ''}
                  {format(parseISO(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>

            {/* Right: meta icons + avatars */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Comment count */}
              {commentCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                  <MessageSquare size={10} />
                  {commentCount}
                </span>
              )}

              {/* Assignees */}
              {assignedUsers.length > 0 && (
                <AvatarGroup users={assignedUsers} max={3} size="xs" />
              )}
            </div>
          </div>
        </div>

        {/* Status indicator strip at bottom */}
        {task.status === 'completed' && (
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent rounded-t-full opacity-50" />
        )}
        {task.status === 'stuck' && (
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-rose-400 to-transparent rounded-t-full opacity-50" />
        )}

        {/* Click overlay to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-20"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
          />
        )}
      </div>

      {showEdit && (
        <TaskForm isOpen={showEdit} onClose={() => setShowEdit(false)} task={task} />
      )}
      {showDetail && (
        <TaskDetail
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          task={task}
          onEdit={() => { setShowDetail(false); setShowEdit(true); }}
        />
      )}
    </>
  );
};
