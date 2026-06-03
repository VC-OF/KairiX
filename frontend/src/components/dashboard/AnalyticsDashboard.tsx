import React, { useEffect, useState } from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, ComposedChart, Line
} from 'recharts';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import {
  TrendingUp, CheckCircle, Trophy, Zap, AlertTriangle, List, LayoutGrid,
  Clock, Target, ArrowUpRight, Users, BarChart2, Activity
} from 'lucide-react';
import { subDays } from 'date-fns';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700/60 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white">{entry.value}{entry.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon, label, value, sub, trend, color, dark = false
}: {
  icon: any; label: string; value: string | number; sub?: string;
  trend?: string; color: string; dark?: boolean;
}) => (
  <div className={`relative rounded-3xl p-6 overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 ${
    dark
      ? 'bg-gray-900 border border-gray-800 hover:border-gray-700 shadow-lg'
      : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:border-gray-700'
  }`}>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl ${color}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-black">
            <ArrowUpRight size={12} />
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-medium">{sub}</p>}
    </div>
    {/* Subtle background glow */}
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.04] bg-indigo-500 blur-2xl pointer-events-none group-hover:opacity-[0.08] transition-opacity" />
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, sub, action }: { icon: any; title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
        <Icon size={17} />
      </div>
      <div>
        <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const AnalyticsDashboard: React.FC = () => {
  const { project } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [comprehensive, setComprehensive] = useState<any>(null);
  const [dailyHours, setDailyHours] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [daysRange, setDaysRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startDate = subDays(today, daysRange);
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        const [statsRes, compRes, hoursRes, taskRes] = await Promise.all([
          api.get(`/analytics/project/${project.id}`),
          api.get(`/analytics/comprehensive/${project.id}?startDate=${fmt(startDate)}&endDate=${fmt(today)}`),
          api.get(`/analytics/daily-hours/${project.id}?days=${daysRange}`),
          api.get(`/analytics/tasks/${project.id}`),
        ]);

        setStats(statsRes);
        setComprehensive(compRes);
        setDailyHours(hoursRes);
        setTaskStats(taskRes);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (project && project.id) fetchAnalytics();
  }, [project.id, daysRange]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-5">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/40" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <Activity size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Synthesizing Analytics</p>
            <p className="text-xs text-gray-400 font-medium">Aggregating project performance data…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived metrics ───────────────────────────────────────────────────────
  const statusData = stats ? [
    { name: 'Pending', value: stats.taskStatus.pending || 0 },
    { name: 'In Progress', value: stats.taskStatus['in-progress'] || 0 },
    { name: 'Stuck', value: stats.taskStatus.stuck || 0 },
    { name: 'Completed', value: stats.taskStatus.completed || 0 },
  ] : [];
  const totalTasks = statusData.reduce((s, d) => s + d.value, 0);
  const completedCount = statusData.find(d => d.name === 'Completed')?.value || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const stuckCount = stats?.taskStatus.stuck || 0;
  const avgEfficiency = stats?.taskStatus.completed > 0
    ? (stats.totalActual / stats.taskStatus.completed).toFixed(1)
    : '0';

  const renderAvatar = (member: any, size = 'w-10 h-10') => {
    const isImage = member.avatar && member.avatar.length > 4;
    return (
      <div className={`${size} flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/60 dark:to-purple-950/60 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-xs overflow-hidden`}>
        {isImage ? (
          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span>{member.avatar || member.name?.[0] || '?'}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 px-1 pb-16 max-w-[1600px] mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pt-1">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-lg shadow-violet-500/20 text-white">
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Project Intelligence</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Advanced metrics for <span className="text-violet-600 dark:text-violet-400 font-bold">"{project.name}"</span>
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1.5 shadow-sm">
          {/* View toggle */}
          <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setViewType('grid')}
              title="Grid View"
              className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewType('table')}
              title="Table View"
              className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <List size={16} />
            </button>
          </div>
          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          {/* Time range */}
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDaysRange(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                daysRange === d
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {d === 7 ? '7D' : d === 30 ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Completion Rate"
          value={`${completionRate}%`}
          sub={`${completedCount} of ${totalTasks} tasks done`}
          trend="+8%"
          color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Clock}
          label="Avg. Efficiency"
          value={`${avgEfficiency}h`}
          sub="Per completed task"
          color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Blocked Tasks"
          value={stuckCount}
          sub={stuckCount > 0 ? "Require immediate attention" : "All clear!"}
          color="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          icon={Users}
          label="Team Members"
          value={comprehensive?.memberStats?.length || 0}
          sub="Active contributors"
          color="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* ── Performance Champions ─────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-8 shadow-2xl shadow-violet-500/20">
        {/* decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none p-8">
          <TrendingUp size={100} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-violet-200/80 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
            <Trophy size={13} />
            Performance Champions
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-violet-200/70 text-xs font-bold mb-2">Most Working Hours</p>
              <h3 className="text-3xl font-black text-white tracking-tight mb-3 truncate">
                {comprehensive?.highlights?.mostHours?.name || '—'}
              </h3>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm font-bold text-white border border-white/10">
                <Clock size={13} />
                {comprehensive?.highlights?.mostHours?.value || 0}h Logged
              </div>
            </div>
            <div className="md:border-l border-white/10 md:pl-8">
              <p className="text-violet-200/70 text-xs font-bold mb-2">Top Task Finisher</p>
              <h3 className="text-3xl font-black text-white tracking-tight mb-3 truncate">
                {comprehensive?.highlights?.mostTasks?.name || '—'}
              </h3>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm font-bold text-white border border-white/10">
                <CheckCircle size={13} />
                {comprehensive?.highlights?.mostTasks?.value || 0} Completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Performance Trend */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 shadow-sm">
          <SectionHeader
            icon={Activity}
            title="Performance Trend"
            sub={`Team output over the last ${daysRange} days`}
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHours} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(dailyHours.length / 6)}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="h" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  unit="h"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#trendGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Productivity */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 shadow-sm">
          <SectionHeader
            icon={BarChart2}
            title="Member Productivity"
            sub="Hours logged vs. tasks completed"
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={comprehensive?.memberStats || []}
                margin={{ top: 5, right: 20, bottom: 5, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7c3aed', fontWeight: 700 }} unit="h" />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#10b981', fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '10px', fontWeight: 700 }}
                />
                <Bar yAxisId="left" dataKey="totalHours" name="Hours" unit="h" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={28} opacity={0.85} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tasksCompleted"
                  name="Tasks"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Member Stats ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-7 pt-7 pb-5">
          <SectionHeader
            icon={Users}
            title="Team Performance"
            sub="Individual productivity breakdown"
            action={
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewType('table')}
                  className={`p-1.5 rounded-lg transition-all ${viewType === 'table' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-gray-400'}`}
                >
                  <List size={14} />
                </button>
              </div>
            }
          />
        </div>

        {viewType === 'grid' ? (
          <div className="px-7 pb-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(comprehensive?.memberStats || []).map((member: any) => (
              <div key={member.id} className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800/50 bg-gray-50/50 dark:bg-gray-800/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  {renderAvatar(member)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 dark:text-white text-sm leading-tight truncate">{member.name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold truncate">{member.email || 'Team Member'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-black text-base">
                      <Zap size={13} /> {member.efficiency}
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Score</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">Efficiency</span>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-black">{Math.min(100, member.efficiency * 10)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, member.efficiency * 10)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Hours', value: `${member.totalHours}h`, color: 'text-gray-900 dark:text-white' },
                    { label: 'Done', value: member.tasksCompleted, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Overdue', value: member.overdueTasks, color: 'text-rose-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <p className={`text-base font-black ${color}`}>{value}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30">
                  {['Member', 'Logged Time', 'Tasks Done', 'Overdue', 'Efficiency'].map(h => (
                    <th key={h} className="px-7 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(comprehensive?.memberStats || []).map((member: any) => (
                  <tr key={member.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        {renderAvatar(member, 'w-9 h-9')}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{member.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-5 font-black text-gray-900 dark:text-white">{member.totalHours}h</td>
                    <td className="px-7 py-5">
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-xs border border-emerald-100 dark:border-emerald-900/40">
                        {member.tasksCompleted} Tasks
                      </span>
                    </td>
                    <td className="px-7 py-5">
                      {member.overdueTasks > 0 ? (
                        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full font-black text-xs border border-rose-100 dark:border-rose-900/40">
                          {member.overdueTasks} Overdue
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold text-sm">—</span>
                      )}
                    </td>
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${Math.min(100, member.efficiency * 10)}%` }} />
                        </div>
                        <span className="font-black text-violet-600 dark:text-violet-400 tabular-nums w-6">{member.efficiency}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Task Performance ──────────────────────────────────────────────────── */}
      {taskStats.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 shadow-sm">
          <SectionHeader
            icon={BarChart2}
            title="Task Performance Analysis"
            sub="Time tracked vs. estimates — identify over/under-runs"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {taskStats.map(task => {
              const isOver = task.cumulativeHours > task.estimatedHours && task.estimatedHours > 0;
              const progress = task.estimatedHours > 0
                ? Math.min(100, (task.cumulativeHours / task.estimatedHours) * 100)
                : 100;
              const isDone = task.status === 'completed';

              return (
                <div key={task.id} className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 bg-gray-50/40 dark:bg-gray-800/20 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm leading-tight pr-2 truncate" title={task.title}>{task.title}</h5>
                    <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                      isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="flex items-end justify-between mb-2.5">
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Tracked</p>
                      <p className={`text-xl font-black ${isOver ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.cumulativeHours}h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Estimate</p>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{task.estimatedHours}h</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isOver
                            ? 'bg-gradient-to-r from-rose-500 to-red-500'
                            : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isOver && (
                      <p className="text-[9px] text-rose-500 font-bold">
                        +{(task.cumulativeHours - task.estimatedHours).toFixed(1)}h over estimate
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
