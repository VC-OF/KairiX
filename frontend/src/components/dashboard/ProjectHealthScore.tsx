import React, { useMemo } from 'react';
import { useStore, Task, DailyLog } from '../../store/useStore';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { isAfter, parseISO } from 'date-fns';

function computeScore(
  tasks: Task[],
  dailyLogs: DailyLog[]
): { score: number; label: string; color: string; bg: string; ring: string } {
  if (tasks.length === 0) return { score: 0, label: 'No Data', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', ring: '#6b7280' };

  const total = tasks.length;
  const stuck = tasks.filter(t => t.status === 'stuck').length;
  const completedOnTime = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    if (!t.dueDate) return true;
    return !isAfter(parseISO(t.updatedAt), parseISO(t.dueDate));
  }).length;

  // Component scores
  const onTimeScore = total > 0 ? (completedOnTime / total) * 40 : 0;
  const noBlockerScore = total > 0 ? (1 - stuck / total) * 30 : 30;
  const today = new Date().toISOString().slice(0, 10);
  const hasRecentLog = dailyLogs.some(l => l.date?.slice(0, 10) === today || l.createdAt?.slice(0, 10) === today);
  const activityScore = hasRecentLog ? 20 : 0;
  const capacityScore = 10;

  const score = Math.round(onTimeScore + noBlockerScore + activityScore + capacityScore);

  if (score >= 80) return { score, label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: '#10b981' };
  if (score >= 60) return { score, label: 'Good', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', ring: '#3b82f6' };
  if (score >= 40) return { score, label: 'At Risk', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', ring: '#f59e0b' };
  return { score, label: 'Critical', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', ring: '#ef4444' };
}

export const ProjectHealthScore: React.FC = () => {
  const { tasks, dailyLogs } = useStore();
  const { score, label, color, bg, ring } = useMemo(() => computeScore(tasks, dailyLogs), [tasks, dailyLogs]);

  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference - (circumference * score) / 100;

  return (
    <div className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-5 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Activity size={14} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Project Health</h3>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular gauge */}
        <div className="relative shrink-0 w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-100 dark:text-gray-800" />
            <circle
              cx="45" cy="45" r="38"
              stroke={ring}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${ring}66)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-black leading-none ${color}`}>{score}</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        {/* Right stats */}
        <div className="flex-1 space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg} ${color}`}>
            {label === 'Excellent' && <CheckCircle2 size={12} />}
            {label === 'Good' && <TrendingUp size={12} />}
            {label === 'At Risk' && <AlertTriangle size={12} />}
            {label === 'Critical' && <AlertTriangle size={12} />}
            {label === 'No Data' && <Users size={12} />}
            {label}
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { label: 'On-time rate', value: tasks.length > 0 ? `${Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%` : '—' },
              { label: 'Blocked tasks', value: tasks.filter(t => t.status === 'stuck').length === 0 ? 'NA' : `${tasks.filter(t => t.status === 'stuck').length}` },
              { label: 'Total tasks', value: `${tasks.length}` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-gray-400 dark:text-gray-500">{row.label}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
