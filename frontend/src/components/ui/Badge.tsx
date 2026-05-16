import React from 'react';
import { TaskStatus } from '../../store/useStore';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'status' | 'priority' | 'tag';
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' },
  stuck: { label: 'Stuck', className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' },
  completed: { label: 'Completed', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800' },
  medium: { label: 'Medium', className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' },
  high: { label: 'High', className: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  priority,
  className = '',
}) => {
  let cls = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ';

  if (variant === 'status' && status) {
    cls += statusConfig[status]?.className || 'bg-gray-100 text-gray-600';
  } else if (variant === 'priority' && priority) {
    cls += priorityConfig[priority]?.className || 'bg-gray-100 text-gray-600';
  } else if (variant === 'tag') {
    cls += 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
  } else {
    cls += 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  }

  cls += ` ${className}`;

  return <span className={cls}>{children}</span>;
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <Badge variant="status" status={status}>
      {config.label}
    </Badge>
  );
};

export const PriorityBadge: React.FC<{ priority: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-100 text-gray-600' };
  const dots: Record<string, string> = {
    low: '●',
    medium: '●●',
    high: '●●●',
  };
  return (
    <Badge variant="priority" priority={priority}>
      <span className="mr-1 text-[8px] tracking-tighter leading-none">{dots[priority] || '●'}</span>
      {config.label}
    </Badge>
  );
};
