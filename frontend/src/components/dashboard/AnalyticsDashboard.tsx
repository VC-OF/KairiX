import React, { useEffect, useState } from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, ComposedChart, Line
} from 'recharts';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import {
  TrendingUp, CheckCircle, Trophy, Zap, AlertTriangle, List, LayoutGrid
} from 'lucide-react';
import { subDays } from 'date-fns';

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-[2px]">Synthesizing Data...</p>
        </div>
      </div>
    );
  }



  const renderAvatar = (member: any, size: string = 'w-12 h-12') => {
    const isImage = member.avatar && member.avatar.length > 4;
    return (
      <div className={`${size} flex-shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-slate-200 dark:border-slate-700 overflow-hidden`}>
        {isImage ? (
          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span className="truncate px-1">{member.avatar || member.name[0]}</span>
        )}
      </div>
    );
  };

  const statusData = stats ? [
    { name: 'Pending', value: stats.taskStatus.pending || 0 },
    { name: 'In Progress', value: stats.taskStatus['in-progress'] || 0 },
    { name: 'Stuck', value: stats.taskStatus.stuck || 0 },
    { name: 'Completed', value: stats.taskStatus.completed || 0 },
  ] : [];

  const totalTasks = statusData.reduce((s, d) => s + d.value, 0);
  const completionRate = totalTasks > 0
    ? Math.round((statusData.find(d => d.name === 'Completed')?.value || 0) / totalTasks * 100)
    : 0;

  return (
    <div className="space-y-8 p-6 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-violet-600 rounded-2xl shadow-lg shadow-violet-600/20 text-white">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Project Intelligence
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Advanced productivity metrics for <span className="text-violet-600 font-bold">"{project.name}"</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mr-2">
            <button 
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600' : 'text-slate-400'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600' : 'text-slate-400'}`}
            >
              <List size={18} />
            </button>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDaysRange(d)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 uppercase tracking-wider ${daysRange === d
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {d === 7 ? 'Weekly' : d === 30 ? 'Monthly' : 'Quarterly'}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-violet-100/80 text-[10px] font-black uppercase tracking-[3px] mb-4">
              <Trophy size={14} /> Performance Champions
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-violet-100/70 text-xs font-bold mb-1">Most Working Hours</p>
                <h3 className="text-2xl font-black truncate">{comprehensive?.highlights?.mostHours?.name || 'N/A'}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
                    {comprehensive?.highlights?.mostHours?.value || 0}h Logged
                  </div>
                </div>
              </div>
              <div className="border-l border-white/10 pl-8">
                <p className="text-violet-100/70 text-xs font-bold mb-1">Top Task Finisher</p>
                <h3 className="text-2xl font-black truncate">{comprehensive?.highlights?.mostTasks?.name || 'N/A'}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
                    {comprehensive?.highlights?.mostTasks?.value || 0} Finished
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <TrendingUp size={120} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-wider">
              {completionRate}% Rate
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Avg. Efficiency</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.taskStatus.completed > 0 ? (stats.totalActual / stats.taskStatus.completed).toFixed(1) : 0}h
          </h3>
          <p className="text-slate-500 text-xs mt-2 font-medium">Per completed task</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase tracking-wider">
              Warning
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Critical Tasks</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.taskStatus.stuck || 0}
          </h3>
          <p className="text-slate-500 text-xs mt-2 font-medium">Require immediate attention</p>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Performance Trends</h3>
              <p className="text-xs text-slate-500 font-medium">Collective team output over the last {daysRange} days</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHours}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={Math.floor(dailyHours.length / 7)}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} unit="h" />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#trendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Comparison */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Member Productivity</h3>
              <p className="text-xs text-slate-500 font-medium">Hours worked vs. Tasks completed</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comprehensive?.memberStats || []} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#8b5cf6', fontWeight: 'bold' }} 
                  unit="h"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#10b981', fontWeight: 'bold' }} 
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar yAxisId="left" dataKey="totalHours" name="Hours Logged" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
                <Line yAxisId="right" type="monotone" dataKey="tasksCompleted" name="Tasks Done" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Stats View */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(comprehensive?.memberStats || []).map((member: any) => (
            <div key={member.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-6 overflow-hidden">
                {renderAvatar(member)}
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-slate-900 dark:text-white leading-tight truncate">{member.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{member.email || 'Team Member'}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="flex items-center gap-1 text-violet-600 font-black text-lg">
                    <Zap size={16} /> {member.efficiency}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="text-center">
                  <p className="text-xl font-black text-slate-900 dark:text-white">{member.totalHours}h</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Worked</p>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                  <p className="text-xl font-black text-emerald-500">{member.tasksCompleted}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Done</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-rose-500">{member.overdueTasks}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Member</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Logged Time</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Tasks Done</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Pending/Overdue</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Efficiency Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {(comprehensive?.memberStats || []).map((member: any) => (
                  <tr key={member.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {renderAvatar(member, 'w-10 h-10')}
                        <span className="font-bold text-slate-900 dark:text-white truncate">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{member.totalHours}h</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-xs">
                        {member.tasksCompleted} Tasks
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">{member.pendingTasks}</span>
                        {member.overdueTasks > 0 && (
                          <span className="text-rose-500 text-xs font-black">({member.overdueTasks} Overdue)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-600 rounded-full" 
                            style={{ width: `${Math.min(100, member.efficiency * 10)}%` }} 
                          />
                        </div>
                        <span className="font-black text-violet-600">{member.efficiency}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <List size={20} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Task Performance Analysis</h3>
            <p className="text-xs text-slate-500 font-medium">Time consumption vs. Estimation per task</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {taskStats.map(task => {
            const isOver = task.cumulativeHours > task.estimatedHours && task.estimatedHours > 0;
            const progress = task.estimatedHours > 0 
              ? Math.min(100, (task.cumulativeHours / task.estimatedHours) * 100)
              : 100;

            return (
              <div key={task.id} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2" title={task.title}>{task.title}</h5>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                    task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {task.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracked</p>
                    <p className={`text-xl font-black ${isOver ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{task.cumulativeHours}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimate</p>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{task.estimatedHours}h</p>
                  </div>
                </div>

                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-violet-600'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
