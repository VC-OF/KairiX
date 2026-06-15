import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus, useStore } from '../../store/useStore';
import { TaskCard } from '../tasks/TaskCard';
import { TaskForm } from '../tasks/TaskForm';
import {
  Plus,
  Circle,
  Clock,
  Flag,
  CheckCircle2,
} from 'lucide-react';

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  bg: string;
  border: string;
  headerText: string;
  countPill: string;
  emptyIcon: React.ReactNode;
  accentLine: string;
  addBtnColor: string;
  isOverBg: string;
}

const columnConfigs: Record<TaskStatus, ColumnConfig> = {
  pending: {
    status: 'pending',
    label: 'Pending',
    bg: 'bg-gray-50/80 dark:bg-gray-900/50',
    border: 'border-gray-200 dark:border-gray-700/60',
    headerText: 'text-gray-600 dark:text-gray-400',
    countPill: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    emptyIcon: <Circle size={28} className="text-gray-300 dark:text-gray-700" />,
    accentLine: 'bg-gray-300 dark:bg-gray-600',
    addBtnColor: 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700',
    isOverBg: 'ring-gray-400',
  },
  'in-progress': {
    status: 'in-progress',
    label: 'In Progress',
    bg: 'bg-blue-50/70 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    headerText: 'text-blue-600 dark:text-blue-400',
    countPill: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    emptyIcon: <Clock size={28} className="text-blue-200 dark:text-blue-900" />,
    accentLine: 'bg-gradient-to-r from-blue-400 to-blue-500',
    addBtnColor: 'text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40',
    isOverBg: 'ring-blue-400',
  },
  stuck: {
    status: 'stuck',
    label: 'Stuck',
    bg: 'bg-rose-50/70 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/50',
    headerText: 'text-rose-600 dark:text-rose-400',
    countPill: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
    emptyIcon: <Flag size={28} className="text-rose-200 dark:text-rose-900" />,
    accentLine: 'bg-gradient-to-r from-rose-400 to-rose-500',
    addBtnColor: 'text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40',
    isOverBg: 'ring-rose-400',
  },
  completed: {
    status: 'completed',
    label: 'Completed',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    headerText: 'text-emerald-600 dark:text-emerald-400',
    countPill: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    emptyIcon: <CheckCircle2 size={28} className="text-emerald-200 dark:text-emerald-900" />,
    accentLine: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    addBtnColor: 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
    isOverBg: 'ring-emerald-400',
  },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks }) => {
  const cfg = columnConfigs[status] || columnConfigs.pending;
  const { currentUser } = useStore();
  const canManageTasks =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'executive' ||
    (currentUser as any)?.projectRole === 'ProjectManager' ||
    (currentUser as any)?.projectRole === 'TeamLead';
  const [showAddTask, setShowAddTask] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <>
      <div
        className={`
          flex flex-col rounded-2xl border ${cfg.border} ${cfg.bg}
          ${isOver ? `ring-2 ring-offset-1 ${cfg.isOverBg}` : ''}
          transition-all duration-200
          min-h-[300px] lg:min-h-[520px] max-h-[450px] lg:max-h-[calc(100vh-248px)]
          overflow-hidden
        `}
      >
        {/* Accent top bar */}
        <div className={`h-1 w-full ${cfg.accentLine} flex-shrink-0`} />

        {/* Column Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 className={`font-bold text-sm ${cfg.headerText} tracking-tight`}>
              {cfg.label}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${cfg.countPill}`}>
              {tasks.length}
            </span>
          </div>

          {canManageTasks && (
            <button
              onClick={() => setShowAddTask(true)}
              className={`p-1.5 rounded-lg transition-all text-sm font-bold ${cfg.addBtnColor}`}
              title={`Add task to ${cfg.label}`}
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Task List */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto px-3 pb-12 space-y-2.5 scrollbar-thin"
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {tasks.length > 0 && (
            <div className="py-6 flex flex-col items-center justify-center opacity-20 pointer-events-none select-none group">
              <div className={`h-[1px] w-8 ${cfg.accentLine} mb-2 opacity-50`} />
              <span className={`text-[9px] font-black uppercase tracking-[3px] ${cfg.headerText}`}>End of tasks</span>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-36 gap-2">
              <div className="opacity-40">
                {cfg.emptyIcon}
              </div>
              <p className={`text-xs font-medium ${cfg.headerText} opacity-50`}>
                No tasks yet
              </p>
              {canManageTasks && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className={`mt-1 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${cfg.addBtnColor}`}
                >
                  <Plus size={11} />
                  Add a task
                </button>
              )}
            </div>
          )}

          {/* Drop zone indicator */}
          {isOver && tasks.length > 0 && (
            <div className={`h-1.5 rounded-full ${cfg.accentLine} opacity-60 animate-pulse`} />
          )}
        </div>

        {/* Footer: task count summary */}
        {tasks.length > 0 && (
          <div className={`px-4 py-2.5 border-t ${cfg.border} flex-shrink-0`}>
            <p className={`text-[10px] font-medium ${cfg.headerText} opacity-60 tabular-nums`}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              {status === 'completed' && ' · ✓ Done'}
            </p>
          </div>
        )}
      </div>

      {showAddTask && (
        <TaskForm
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          defaultStatus={status}
        />
      )}
    </>
  );
};
