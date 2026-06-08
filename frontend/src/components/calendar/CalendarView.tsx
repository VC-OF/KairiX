import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../utils/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
  Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TimeLogEntry {
  _id: string;
  taskId: { _id: string; title: string; status: string; priority: string; tags?: string[] } | string;
  projectId: string;
  userId: { _id: string; name: string; email: string; avatar: string } | string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  workDate: string;
  description: string;
  isBillable: boolean;
  status: 'active' | 'paused' | 'completed';
}

interface ActiveTimer {
  _id: string;
  taskId: { _id: string; title: string; status: string; priority: string } | null;
  userId: { _id: string; name: string; avatar: string } | null;
  startTime: string;
  projectId: string;
}

interface DayTaskSummary {
  taskId: string;
  taskTitle: string;
  durationSeconds: number;
  durationFormatted: string;
  isActive: boolean; // currently being tracked
}

interface DayUserSummary {
  userId: string;
  userName: string;
  userAvatar: string;
  totalSeconds: number;
  totalFormatted: string;
  tasks: DayTaskSummary[];
  isActiveNow: boolean;
  activeTaskTitle?: string;
}

interface DaySummary {
  date: string;
  dayOfWeek: number; // 0=Sun, 6=Sat
  dayNumber: number;
  totalSeconds: number;
  totalFormatted: string;
  employeesWorked: number;
  tasksWorked: number;
  productivity: number;
  userSummaries: DayUserSummary[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0h 0m';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

const getTaskId = (taskId: TimeLogEntry['taskId']): string => {
  if (typeof taskId === 'string') return taskId;
  return taskId?._id || '';
};

const getTaskTitle = (taskId: TimeLogEntry['taskId']): string => {
  if (typeof taskId === 'string') return 'Unknown Task';
  return taskId?.title || 'Unknown Task';
};

const getUserId = (userId: TimeLogEntry['userId']): string => {
  if (typeof userId === 'string') return userId;
  return userId?._id || '';
};

const getUserName = (userId: TimeLogEntry['userId']): string => {
  if (typeof userId === 'string') return 'Unknown';
  return userId?.name || 'Unknown';
};

const getUserAvatar = (userId: TimeLogEntry['userId']): string => {
  if (typeof userId === 'string') return '?';
  return userId?.avatar || '?';
};

const renderAvatar = (avatar: string, name: string) => {
  const isImage = avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
  if (isImage) {
    return <img src={avatar} alt={name} className="w-full h-full object-cover rounded-[inherit]" />;
  }
  return <span className="truncate px-1 leading-none">{avatar?.substring(0, 3)}</span>;
};

const getShortTaskId = (fullId: string): string => {
  if (!fullId) return '';
  // Show last 6 chars of the MongoDB ObjectId for brevity
  return fullId.length > 6 ? `#${fullId.slice(-6).toUpperCase()}` : `#${fullId.toUpperCase()}`;
};

// Build a week's worth of dates (Mon-Sun) from a reference date
const getWeekDates = (refDate: Date): Date[] => {
  const d = new Date(refDate);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
};

const formatDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TASK_COLORS = [
  { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200', text: 'text-indigo-700 dark:text-indigo-300', badge: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:text-emerald-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const CalendarView: React.FC = () => {
  const { users, project } = useStore();
  const [selectedType, setSelectedType] = useState<'team' | 'employee'>('team');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0); // index into weekDates
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'resource'>('week');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>([]);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [loading, setLoading] = useState(false);

  // Compute the current week dates
  const weekDates = useMemo(() => getWeekDates(referenceDate), [referenceDate]);

  // Format the week range label
  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }, [weekDates]);

  // Month label
  const monthLabel = useMemo(() => {
    return `${MONTH_NAMES[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`;
  }, [referenceDate]);

  // ─── Fetch time logs from API ───────────────────────────────────────────────
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string, endDate: string;
      
      if (timeframe === 'month') {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        startDate = formatDateStr(new Date(year, month, 1));
        endDate = formatDateStr(new Date(year, month + 1, 0));
      } else {
        startDate = formatDateStr(weekDates[0]);
        endDate = formatDateStr(weekDates[6]);
      }

      const params = new URLSearchParams();
      if (project.id && project.id !== 'project-1') params.append('projectId', project.id);
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedType === 'employee' && selectedEmployeeId) {
        params.append('userId', selectedEmployeeId);
      }

      const [logs, timers] = await Promise.all([
        api.get<TimeLogEntry[]>(`/time-logs/calendar-data?${params.toString()}`),
        api.get<ActiveTimer[]>(`/time-logs/active-timers${project.id && project.id !== 'project-1' ? `?projectId=${project.id}` : ''}`)
      ]);

      setTimeLogs(logs || []);
      setActiveTimers(timers || []);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setTimeLogs([]);
      setActiveTimers([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe, referenceDate, weekDates, project.id, selectedType, selectedEmployeeId]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Auto-refresh active timers every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const timers = await api.get<ActiveTimer[]>(
          `/time-logs/active-timers${project.id && project.id !== 'project-1' ? `?projectId=${project.id}` : ''}`
        );
        setActiveTimers(timers || []);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [project.id]);

  // Set today as selected day index on mount
  useEffect(() => {
    const today = new Date();
    const todayStr = formatDateStr(today);
    const idx = weekDates.findIndex(d => formatDateStr(d) === todayStr);
    if (idx >= 0) setSelectedDayIndex(idx);
  }, [weekDates]);

  // Select first user if none selected
  useEffect(() => {
    if (selectedType === 'employee' && !selectedEmployeeId && users.length > 0) {
      setSelectedEmployeeId(users[0].id);
    }
  }, [selectedType, selectedEmployeeId, users]);

  // ─── Derive day summaries from time logs ────────────────────────────────────
  const activeTimerMap = useMemo(() => {
    const map: Record<string, { taskTitle: string; taskId: string }> = {};
    for (const timer of activeTimers) {
      const uid = timer.userId ? (typeof timer.userId === 'string' ? timer.userId : timer.userId._id) : '';
      if (uid) {
        map[uid] = {
          taskTitle: timer.taskId ? (typeof timer.taskId === 'string' ? '' : timer.taskId.title) : '',
          taskId: timer.taskId ? (typeof timer.taskId === 'string' ? timer.taskId : timer.taskId._id) : ''
        };
      }
    }
    return map;
  }, [activeTimers]);

  // Build day summaries for whatever date range we're showing
  const buildDaySummaries = useCallback((dates: Date[]): Map<string, DaySummary> => {
    const map = new Map<string, DaySummary>();

    // Initialize all dates
    for (const d of dates) {
      const dateStr = formatDateStr(d);
      map.set(dateStr, {
        date: dateStr,
        dayOfWeek: d.getDay(),
        dayNumber: d.getDate(),
        totalSeconds: 0,
        totalFormatted: '0h 0m',
        employeesWorked: 0,
        tasksWorked: 0,
        productivity: 0,
        userSummaries: []
      });
    }

    // Group logs by date -> user -> task
    const logsByDate: Record<string, Record<string, Record<string, { seconds: number; title: string; isActive: boolean }>>> = {};
    
    for (const log of timeLogs) {
      const dateStr = log.workDate;
      if (!logsByDate[dateStr]) logsByDate[dateStr] = {};
      
      const uid = getUserId(log.userId);
      if (!logsByDate[dateStr][uid]) logsByDate[dateStr][uid] = {};
      
      const tid = getTaskId(log.taskId);
      if (!logsByDate[dateStr][uid][tid]) {
        logsByDate[dateStr][uid][tid] = { seconds: 0, title: getTaskTitle(log.taskId), isActive: false };
      }
      
      let duration = log.duration || 0;
      if (log.status === 'active' && log.startTime) {
        // Active timer: compute live duration
        duration = Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000);
      }
      logsByDate[dateStr][uid][tid].seconds += duration;
      if (log.status === 'active') logsByDate[dateStr][uid][tid].isActive = true;
    }

    // Aggregate
    for (const [dateStr, userMap] of Object.entries(logsByDate)) {
      const summary = map.get(dateStr);
      if (!summary) continue;

      let totalDaySeconds = 0;
      const uniqueEmployees = new Set<string>();
      const uniqueTasks = new Set<string>();
      const userSummaries: DayUserSummary[] = [];

      for (const [uid, taskMap] of Object.entries(userMap)) {
        uniqueEmployees.add(uid);
        let userTotalSeconds = 0;
        const dayTasks: DayTaskSummary[] = [];

        for (const [tid, info] of Object.entries(taskMap)) {
          uniqueTasks.add(tid);
          userTotalSeconds += info.seconds;
          dayTasks.push({
            taskId: tid,
            taskTitle: info.title,
            durationSeconds: info.seconds,
            durationFormatted: formatDuration(info.seconds),
            isActive: info.isActive || !!activeTimerMap[uid]
          });
        }

        totalDaySeconds += userTotalSeconds;

        // Find user info
        const userObj = users.find(u => u.id === uid);
        const userName = userObj ? userObj.name : getUserName(timeLogs.find(l => getUserId(l.userId) === uid)?.userId || uid);
        const userAvatar = userObj ? userObj.avatar : getUserAvatar(timeLogs.find(l => getUserId(l.userId) === uid)?.userId || uid);

        userSummaries.push({
          userId: uid,
          userName,
          userAvatar,
          totalSeconds: userTotalSeconds,
          totalFormatted: formatDuration(userTotalSeconds),
          tasks: dayTasks.sort((a, b) => b.durationSeconds - a.durationSeconds),
          isActiveNow: !!activeTimerMap[uid],
          activeTaskTitle: activeTimerMap[uid]?.taskTitle
        });
      }

      summary.totalSeconds = totalDaySeconds;
      summary.totalFormatted = formatDuration(totalDaySeconds);
      summary.employeesWorked = uniqueEmployees.size;
      summary.tasksWorked = uniqueTasks.size;
      // Productivity: ratio of worked hours vs 8h per employee
      const expectedSeconds = uniqueEmployees.size * 8 * 3600;
      summary.productivity = expectedSeconds > 0 ? Math.min(100, Math.round((totalDaySeconds / expectedSeconds) * 100)) : 0;
      summary.userSummaries = userSummaries.sort((a, b) => b.totalSeconds - a.totalSeconds);

      map.set(dateStr, summary);
    }

    return map;
  }, [timeLogs, users, activeTimerMap]);

  const weekSummaries = useMemo(() => buildDaySummaries(weekDates), [buildDaySummaries, weekDates]);

  // Month days computation
  const monthDays = useMemo(() => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startOffset = firstDay.getDay(); // 0=Sun

    const dates: Date[] = [];
    for (let i = 1; i <= totalDays; i++) {
      dates.push(new Date(year, month, i));
    }
    return { dates, startOffset, totalDays };
  }, [referenceDate]);

  const monthSummaries = useMemo(() => {
    if (timeframe !== 'month') return new Map<string, DaySummary>();
    return buildDaySummaries(monthDays.dates);
  }, [buildDaySummaries, monthDays.dates, timeframe]);

  // Selected day data
  const selectedDate = weekDates[selectedDayIndex] || weekDates[0];
  const selectedDateStr = formatDateStr(selectedDate);
  const selectedDaySummary = weekSummaries.get(selectedDateStr);

  // Active employee for employee view
  const activeEmployee = useMemo(() => {
    if (selectedType !== 'employee') return null;
    return users.find(u => u.id === selectedEmployeeId) || users[0] || null;
  }, [selectedType, selectedEmployeeId, users]);

  // Employee's task list for the selected day
  const employeeDayData = useMemo(() => {
    if (!activeEmployee || !selectedDaySummary) return null;
    return selectedDaySummary.userSummaries.find(us => us.userId === activeEmployee.id) || null;
  }, [activeEmployee, selectedDaySummary]);

  // Week totals for stats banner
  const weekTotals = useMemo(() => {
    let totalSeconds = 0;
    let totalTasks = 0;
    let totalEmployees = new Set<string>();

    for (const [, summary] of weekSummaries) {
      totalSeconds += summary.totalSeconds;
      totalTasks += summary.tasksWorked;
      summary.userSummaries.forEach(us => totalEmployees.add(us.userId));
    }

    const expectedSeconds = totalEmployees.size * 8 * 3600 * 5; // 5 working days
    const utilization = expectedSeconds > 0 ? Math.min(100, Math.round((totalSeconds / expectedSeconds) * 100)) : 0;
    
    return {
      totalFormatted: formatDuration(totalSeconds),
      totalTasks,
      totalEmployees: totalEmployees.size,
      utilization,
      billableFormatted: formatDuration(Math.round(totalSeconds * 0.8)) // rough 80% billable estimate
    };
  }, [weekSummaries]);

  // Navigation handlers
  const goToPreviousWeek = () => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 7);
    setReferenceDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 7);
    setReferenceDate(d);
  };

  const goToToday = () => {
    setReferenceDate(new Date());
    const today = new Date();
    const todayStr = formatDateStr(today);
    const newWeek = getWeekDates(today);
    const idx = newWeek.findIndex(d => formatDateStr(d) === todayStr);
    if (idx >= 0) setSelectedDayIndex(idx);
  };

  const goToPreviousMonth = () => {
    const d = new Date(referenceDate);
    d.setMonth(d.getMonth() - 1);
    setReferenceDate(d);
  };

  const goToNextMonth = () => {
    const d = new Date(referenceDate);
    d.setMonth(d.getMonth() + 1);
    setReferenceDate(d);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden font-sans">
      
      {/* 1. Dashboard Sub-Header / Filters */}
      <div className="bg-white dark:bg-obsidian-900 border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        
        {/* Navigation and date label */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-gray-800/50 rounded-lg p-1">
            <button 
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-800 dark:bg-obsidian-900 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
              onClick={timeframe === 'month' ? goToPreviousMonth : goToPreviousWeek}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-800 dark:bg-obsidian-900 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
              onClick={timeframe === 'month' ? goToNextMonth : goToNextWeek}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 tracking-tight">
            {timeframe === 'month' ? monthLabel : weekLabel}
          </h2>

          <button 
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            onClick={goToToday}
          >
            Today
          </button>

          {loading && <Loader2 size={14} className="animate-spin text-indigo-500" />}
        </div>

        {/* View Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Week / Month / Resource Segmented Control */}
          <div className="flex bg-slate-100 dark:bg-gray-800/50 rounded-xl p-1 shadow-inner border border-slate-200 dark:border-gray-800">
            <button
              onClick={() => { setTimeframe('week'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => { setTimeframe('month'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => { setTimeframe('resource'); setSelectedType('team'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                timeframe === 'resource'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-200'
              }`}
            >
              Resource Calendar
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Employee selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedType === 'employee' ? selectedEmployeeId : 'team'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'team') {
                    setSelectedType('team');
                  } else {
                    setSelectedType('employee');
                    setSelectedEmployeeId(val);
                    // Only switch away from resource view (not applicable to single employee)
                    if (timeframe === 'resource') setTimeframe('week');
                  }
                }}
                className="appearance-none pr-8 pl-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-obsidian-900 hover:bg-slate-50 dark:hover:bg-gray-800/50 dark:bg-obsidian-950 text-xs font-black text-slate-700 dark:text-slate-300 dark:text-gray-600 focus:outline-none cursor-pointer"
              >
                <option value="team">Entire Team</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>

        </div>

      </div>

      {/* 2. Stats Banner (Team views only) */}
      {selectedType !== 'employee' && timeframe !== 'resource' && (
        <div className="bg-white dark:bg-obsidian-900 border-b border-slate-200 dark:border-gray-800 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          
          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Total Work Hours</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-2">{weekTotals.totalFormatted}</p>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-gray-500 mt-1">
              {weekTotals.totalEmployees} team member{weekTotals.totalEmployees !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Tasks Worked</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-2">{weekTotals.totalTasks}</p>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-gray-500 mt-1">
              across {timeframe === 'month' ? 'month' : 'week'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Team Utilization</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-2">{weekTotals.utilization}%</p>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-gray-500 mt-1">
              vs 8h/day baseline
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Active Now</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-2">
              {activeTimers.length}
              {activeTimers.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-50 dark:bg-emerald-500/100 animate-pulse" />}
            </p>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-gray-500 mt-1">
              {activeTimers.length === 1 ? 'timer' : 'timers'} running
            </p>
          </div>

        </div>
      )}

      {/* 3. Main Render Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-slate-50 dark:bg-obsidian-950">
        
        {(() => {
          
          // ==================== WEEKLY TEAM VIEW ====================
          if (timeframe === 'week' && selectedType !== 'employee') {
            return (
              <div className="flex flex-col gap-6 h-full justify-between">
                
                {/* 7-column week grid */}
                <div 
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '16px' }}
                  className="flex-1"
                >
                  {weekDates.map((date, idx) => {
                    const dateStr = formatDateStr(date);
                    const summary = weekSummaries.get(dateStr);
                    const isSelected = selectedDayIndex === idx;
                    const isToday = dateStr === formatDateStr(new Date());
                    const hasData = summary && summary.totalSeconds > 0;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`text-left p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between h-[280px] shadow-sm select-none cursor-pointer ${
                          isSelected 
                            ? 'bg-black text-white dark:bg-zinc-950 border-black dark:border-zinc-800 ring-2 ring-zinc-500/20 shadow-md scale-[1.02]' 
                            : isToday 
                              ? 'bg-gradient-to-tr from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10 border-[#ee2a7b]/40 ring-1 ring-[#ee2a7b]/30 hover:shadow-md hover:scale-[1.01]'
                              : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:border-gray-700 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-black leading-none ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{DAY_NAMES[date.getDay()]}</p>
                            {isToday && <span className="text-[8px] font-black text-white bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-1.5 py-0.5 rounded shadow-sm">TODAY</span>}
                          </div>
                          <p className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-zinc-400' : 'text-slate-400 dark:text-gray-500'}`}>
                            {MONTH_NAMES[date.getMonth()]} {date.getDate()}
                          </p>
                        </div>

                        <div className="mt-auto w-full">
                          <p className={`text-2xl font-black tracking-tight leading-none ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {hasData ? summary!.totalFormatted : '0h 0m'}
                          </p>
                          <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isSelected ? 'text-zinc-400' : 'text-slate-400 dark:text-gray-500'}`}>Work Hours</p>
                          
                          <div className={`mt-5 space-y-2 border-t pt-3 ${isSelected ? 'border-zinc-800' : 'border-slate-100 dark:border-gray-800/50'}`}>
                            <div className={`flex justify-between items-center text-[10px] font-extrabold leading-none ${isSelected ? 'text-zinc-300' : 'text-slate-500 dark:text-gray-400'}`}>
                              <span>{summary?.employeesWorked || 0} Employee{(summary?.employeesWorked || 0) !== 1 ? 's' : ''}</span>
                            </div>
                            <div className={`flex justify-between items-center text-[10px] font-extrabold leading-none ${isSelected ? 'text-zinc-300' : 'text-slate-500 dark:text-gray-400'}`}>
                              <span>{summary?.tasksWorked || 0} Task{(summary?.tasksWorked || 0) !== 1 ? 's' : ''} Worked</span>
                            </div>
                            {/* Show active workers */}
                            {summary && summary.userSummaries.filter(us => us.isActiveNow).length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 animate-pulse" />
                                <span>{summary.userSummaries.filter(us => us.isActiveNow).length} active now</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 w-full">
                          <div className={`flex items-center justify-between text-[9px] font-black mb-1 ${isSelected ? 'text-zinc-350' : 'text-slate-500 dark:text-gray-400'}`}>
                            <span>Productivity</span>
                            <span className={isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>{summary?.productivity || 0}%</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-zinc-800' : 'bg-slate-100 dark:bg-gray-800/50'}`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-white' : 'bg-indigo-600'}`}
                              style={{ width: `${summary?.productivity || 0}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom: Team activity for selected day */}
                {selectedDaySummary && selectedDaySummary.userSummaries.length > 0 && (
                  <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 dark:text-gray-600 uppercase tracking-widest mb-3.5">
                      Team Activity — {DAY_NAMES[selectedDate.getDay()]} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
                    </p>
                    <div className="space-y-3">
                      {selectedDaySummary.userSummaries.map(us => (
                        <div key={us.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/50 dark:bg-obsidian-950 transition-all">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-300">
                              {renderAvatar(us.userAvatar, us.userName)}
                            </div>
                            {us.isActiveNow && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 border-2 border-white animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{us.userName}</p>
                              {us.isActiveNow && (
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                  WORKING
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {us.tasks.map((t, i) => (
                                <span 
                                  key={t.taskId} 
                                  className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${TASK_COLORS[i % TASK_COLORS.length].badge}`}
                                  title={t.taskTitle}
                                >
                                  {getShortTaskId(t.taskId)} · {t.durationFormatted}
                                  {t.isActive && ' ⏱'}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-200 shrink-0">{us.totalFormatted}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!selectedDaySummary || selectedDaySummary.userSummaries.length === 0) && !loading && (
                  <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm text-center">
                    <CalendarIcon size={40} className="mx-auto text-slate-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-black text-slate-400 dark:text-gray-500">No time logs recorded for this period</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Team members need to track time on tasks to see data here</p>
                  </div>
                )}

              </div>
            );
          }

          // ==================== EMPLOYEE DAILY TIMELINE VIEW ====================
          if (selectedType === 'employee' && timeframe === 'week') {
            const emp = activeEmployee;
            const dayData = employeeDayData;
            const empColor = emp ? (users.find(u => u.id === emp.id)?.color || '#6366f1') : '#6366f1';

            return (
              <div className="flex flex-col xl:flex-row h-full w-full gap-6 select-none overflow-hidden">
                
                {/* Left: Week mini-cards + daily timeline */}
                <div className="flex-1 flex flex-col gap-5 overflow-y-auto">

                  {/* Week mini cards for the employee */}
                  <div 
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px' }}
                    className="shrink-0"
                  >
                    {weekDates.map((date, idx) => {
                      const dateStr = formatDateStr(date);
                      const summary = weekSummaries.get(dateStr);
                      const empData = summary?.userSummaries.find(us => us.userId === selectedEmployeeId);
                      const isSelected = selectedDayIndex === idx;
                      const isToday = dateStr === formatDateStr(new Date());

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-obsidian-900 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm'
                              : isToday
                                ? 'bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-orange-500/10 border-fuchsia-500/50 ring-1 ring-fuchsia-500/50 hover:shadow-sm'
                                : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:border-gray-700 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 dark:text-gray-500">{DAY_NAMES[date.getDay()]}</span>
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-600 to-orange-500 shadow-sm" />}
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-none">
                            {empData ? empData.totalFormatted : '0h 0m'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 mt-1">
                            {empData ? `${empData.tasks.length} task${empData.tasks.length !== 1 ? 's' : ''}` : 'No logs'}
                          </p>
                          {empData && empData.isActiveNow && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 animate-pulse" />
                              <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">ACTIVE</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Timeline / Task blocks for selected day */}
                  <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex-1 overflow-y-auto">
                    <div className="pb-4 border-b border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Task Activity — {DAY_NAMES[selectedDate.getDay()]} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
                      </h3>
                      <span className="text-xs font-extrabold text-slate-400 dark:text-gray-500">
                        {dayData ? dayData.totalFormatted : '0h 0m'} total
                      </span>
                    </div>

                    {dayData && dayData.tasks.length > 0 ? (
                      <div className="mt-5 space-y-3">
                        {dayData.tasks.map((task, idx) => {
                          const colors = TASK_COLORS[idx % TASK_COLORS.length];
                          const pctOfDay = Math.min(100, Math.round((task.durationSeconds / (dayData.totalSeconds || 1)) * 100));

                          return (
                            <div 
                              key={task.taskId}
                              className={`${colors.bg} border ${colors.border} rounded-2xl p-4 transition-all hover:shadow-md`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black ${colors.text}`}>
                                    {getShortTaskId(task.taskId)}
                                  </span>
                                  {task.isActive && (
                                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 animate-pulse" />
                                      WORKING NOW
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs font-black ${colors.text}`}>
                                  {task.durationFormatted}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-gray-600 mb-2">{task.taskTitle}</p>
                              
                              {/* Progress bar showing % of day */}
                              <div className="w-full bg-white dark:bg-obsidian-900/60 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-current h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pctOfDay}%`, color: 'currentColor' }}
                                />
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 mt-1">{pctOfDay}% of day</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Clock size={36} className="text-slate-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-black text-slate-400 dark:text-gray-500">No time logs for this day</p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">This employee hasn't tracked any time on this date</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Profile + Summary Panel */}
                <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-5 overflow-y-auto select-none">
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Total Work Time</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{dayData ? dayData.totalFormatted : '0h 0m'}</p>
                    </div>
                    <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Tasks Worked</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{dayData ? dayData.tasks.length : 0}</p>
                    </div>
                    <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Status</p>
                      <p className={`text-lg font-black mt-1 ${dayData?.isActiveNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500'}`}>
                        {dayData?.isActiveNow ? 'Active' : 'Offline'}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Productivity</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {dayData ? Math.min(100, Math.round((dayData.totalSeconds / (8 * 3600)) * 100)) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Profile Info */}
                  {emp && (
                    <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col items-center shrink-0">
                      <div className="relative">
                        <div 
                          className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-md"
                          style={{ backgroundColor: empColor }}
                        >
                          {renderAvatar(emp.avatar, emp.name)}
                        </div>
                        {dayData?.isActiveNow && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 border-3 border-white animate-pulse flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white dark:bg-obsidian-900" />
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mt-3 tracking-tight">{emp.name}</h3>
                      <p className="text-xs font-bold text-slate-400 dark:text-gray-500 mt-0.5">{emp.email}</p>
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg mt-2 uppercase">{emp.role}</p>

                      {/* Productivity Circle */}
                      {dayData && (
                        <div className="relative w-24 h-24 mt-5">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" className="stroke-slate-100 fill-none" strokeWidth="6" />
                            <circle 
                              cx="48" cy="48" r="40" 
                              className="stroke-indigo-600 fill-none" 
                              strokeWidth="6" 
                              strokeDasharray="251.2" 
                              strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.round((dayData.totalSeconds / (8 * 3600)) * 100))) / 100} 
                              strokeLinecap="round" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-black text-slate-800 dark:text-slate-200 leading-none">
                              {Math.min(100, Math.round((dayData.totalSeconds / (8 * 3600)) * 100))}%
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase mt-0.5 tracking-tighter">Productivity</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Summary Table */}
                  <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm shrink-0">
                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3.5">Task Summary</p>
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-xs font-bold border-b border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 pb-1.5">
                        <span className="text-slate-400 dark:text-gray-500">Task ID</span>
                        <span className="text-slate-400 dark:text-gray-500">Time Spent</span>
                      </div>
                      
                      {dayData && dayData.tasks.length > 0 ? (
                        <>
                          {dayData.tasks.map(t => (
                            <div key={t.taskId} className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-gray-600">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 shrink-0" title={t.taskId}>
                                  {getShortTaskId(t.taskId)}
                                </span>
                                <span className="text-slate-500 dark:text-gray-400 truncate text-[10px]" title={t.taskTitle}>{t.taskTitle}</span>
                                {t.isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 animate-pulse shrink-0" />
                                )}
                              </div>
                              <span className="shrink-0 ml-2">{t.durationFormatted}</span>
                            </div>
                          ))}

                          <div className="flex justify-between items-center text-xs font-black text-indigo-700 dark:text-indigo-300 border-t border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 pt-2.5">
                            <span>Total</span>
                            <span>{dayData.totalFormatted}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-gray-500 text-center py-4">No tasks logged</p>
                      )}
                    </div>
                  </div>

                  {/* Active work indicator */}
                  {dayData?.isActiveNow && dayData.activeTaskTitle && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 shadow-sm shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-50 dark:bg-emerald-500/100 animate-pulse" />
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Currently Working On</p>
                      </div>
                      <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">{dayData.activeTaskTitle}</p>
                    </div>
                  )}

                </div>

              </div>
            );
          }

          // ==================== MONTHLY HEATMAP VIEW (team or employee) ====================
          if (timeframe === 'month') {
            const isEmployeeMonth = selectedType === 'employee' && activeEmployee;
            const monthTitle = isEmployeeMonth ? `${activeEmployee!.name} — Monthly View` : 'Monthly Productivity Heatmap';
            return (
              <div className="flex-1 flex flex-col bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-y-auto">
                <div className="pb-4 border-b border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{monthTitle}</h3>
                  <span className="text-xs font-extrabold text-slate-400 dark:text-gray-500">{monthLabel}</span>
                </div>

                {/* Employee stats banner for month */}
                {isEmployeeMonth && (
                  <div className="grid grid-cols-3 gap-3 mt-4 shrink-0">
                    {(() => {
                      let empMonthSeconds = 0;
                      let empMonthTasks = new Set<string>();
                      let empDaysWorked = 0;
                      for (const [, summary] of monthSummaries) {
                        const empData = summary.userSummaries.find(us => us.userId === activeEmployee!.id);
                        if (empData && empData.totalSeconds > 0) {
                          empMonthSeconds += empData.totalSeconds;
                          empData.tasks.forEach(t => empMonthTasks.add(t.taskId));
                          empDaysWorked++;
                        }
                      }
                      return (
                        <>
                          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Monthly Hours</p>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{formatDuration(empMonthSeconds)}</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Tasks Worked</p>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{empMonthTasks.size}</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-obsidian-950 rounded-2xl border border-slate-200 dark:border-gray-800/50">
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">Days Active</p>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{empDaysWorked}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Grid headers */}
                <div 
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '12px', marginTop: '20px' }}
                  className="shrink-0"
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
                    <div key={w} className="text-center py-2 bg-slate-50 dark:bg-obsidian-950 border border-slate-100 dark:border-gray-800/50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">{w}</span>
                    </div>
                  ))}
                </div>

                {/* Day cards grid */}
                <div 
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '12px', marginTop: '12px' }}
                  className="flex-1"
                >
                  {/* Empty cells for offset */}
                  {[...Array(monthDays.startOffset)].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-transparent border border-transparent rounded-2xl" />
                  ))}

                  {monthDays.dates.map(date => {
                    const dateStr = formatDateStr(date);
                    const summary = monthSummaries.get(dateStr);
                    const isToday = dateStr === formatDateStr(new Date());

                    // For employee month view, extract the specific employee's data
                    const empDayData = isEmployeeMonth 
                      ? summary?.userSummaries.find(us => us.userId === activeEmployee!.id) 
                      : null;

                    // Determine what to show: employee data or team aggregate
                    const displaySeconds = isEmployeeMonth 
                      ? (empDayData?.totalSeconds || 0) 
                      : (summary?.totalSeconds || 0);
                    const hasData = displaySeconds > 0;
                    const displayFormatted = formatDuration(displaySeconds);
                    
                    // Productivity for employee: vs 8h day, for team: existing calculation
                    const productivity = isEmployeeMonth 
                      ? (displaySeconds > 0 ? Math.min(100, Math.round((displaySeconds / (8 * 3600)) * 100)) : 0)
                      : (summary?.productivity || 0);

                    // Color based on productivity
                    let bgCol = 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-gray-800 text-slate-800 dark:text-slate-200';
                    if (hasData) {
                      if (productivity >= 80) {
                        bgCol = 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white border-transparent shadow-[0_0_12px_rgba(238,42,123,0.3)] hover:scale-[1.01]';
                      } else if (productivity >= 60) {
                        bgCol = 'bg-black text-white dark:bg-zinc-950 border-black dark:border-zinc-800 shadow-md hover:scale-[1.01]';
                      } else if (productivity >= 40) {
                        bgCol = 'bg-slate-850 text-white dark:bg-zinc-900 border-slate-700 dark:border-zinc-850';
                      } else {
                        bgCol = 'bg-slate-700 text-white dark:bg-zinc-850 border-slate-600 dark:border-zinc-700';
                      }
                    }

                    return (
                      <div
                        key={dateStr}
                        className={`text-left p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between min-h-[90px] ${bgCol} ${
                          isToday ? 'ring-2 ring-[#ee2a7b] border-transparent shadow-[0_0_15px_rgba(238,42,123,0.35)]' : ''
                        }`}
                      >
                        <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded ${
                          isToday 
                            ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-sm font-extrabold' 
                            : productivity >= 60 
                            ? 'text-white/80' 
                            : 'text-slate-400 dark:text-gray-500'
                        }`}>
                          {date.getDate()}
                        </span>

                        {hasData ? (
                          <div className="mt-2 text-left w-full">
                            <p className="text-xs font-black tracking-tight leading-none">{displayFormatted}</p>
                            
                            {/* Employee view: show task IDs */}
                            {isEmployeeMonth && empDayData && empDayData.tasks.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {empDayData.tasks.map((t) => (
                                  <span 
                                    key={t.taskId}
                                    className={`text-[7px] font-black px-1 py-0.5 rounded leading-none ${
                                      productivity >= 60 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                    }`}
                                    title={`${t.taskTitle} — ${t.durationFormatted}`}
                                  >
                                    {getShortTaskId(t.taskId)}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Team view: task count */}
                            {!isEmployeeMonth && (
                              <p className={`text-[9px] font-black mt-1 ${productivity >= 60 ? 'text-white/85' : 'text-slate-400 dark:text-gray-500'}`}>
                                {summary!.tasksWorked} task{summary!.tasksWorked !== 1 ? 's' : ''} · {productivity}%
                              </p>
                            )}

                            {/* Employee view: productivity */}
                            {isEmployeeMonth && (
                              <p className={`text-[9px] font-black mt-1 ${productivity >= 60 ? 'text-white/85' : 'text-slate-400 dark:text-gray-500'}`}>
                                {productivity}%
                              </p>
                            )}
                            
                            {/* Active indicator */}
                            {empDayData?.isActiveNow && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-obsidian-900 animate-pulse" />
                                <span className={`text-[8px] font-black ${productivity >= 60 ? 'text-white/90' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  WORKING
                                </span>
                              </div>
                            )}
                            {!isEmployeeMonth && summary!.userSummaries.some(us => us.isActiveNow) && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-obsidian-900 animate-pulse" />
                                <span className={`text-[8px] font-black ${productivity >= 60 ? 'text-white/90' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  ACTIVE
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-auto">
                            <span className="text-[8px] font-black text-slate-300 dark:text-gray-600 uppercase">No Logs</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Heatmap Legend */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6 border-t border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 pt-4 shrink-0">
                  <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Heatmap Scale:</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">No Data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-slate-700 dark:bg-zinc-850 border border-slate-600" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">Low (&lt;40%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-slate-850 dark:bg-zinc-900 border border-slate-700" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">Medium (40-59%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-black dark:bg-zinc-950 border border-black" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">Good (60-79%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">High (80%+)</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          }

          // ==================== RESOURCE ALLOCATION CALENDAR ====================
          if (timeframe === 'resource') {
            return (
              <div className="flex-1 flex flex-col bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-y-auto">
                <div className="pb-4 border-b border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Resource Allocation Calendar</h3>
                  <span className="text-xs font-extrabold text-slate-400 dark:text-gray-500">Weekly allocation loads</span>
                </div>

                {/* Grid table headers */}
                <div 
                  style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(7, minmax(0, 1fr))', gap: '12px', marginTop: '20px' }}
                  className="shrink-0 border-b border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 pb-3"
                >
                  <div className="text-left font-black text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-2">Employees</div>
                  {weekDates.map(date => (
                    <div key={formatDateStr(date)} className="text-center">
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-none">{DAY_NAMES[date.getDay()]}</p>
                      <p className="text-[8.5px] font-bold text-slate-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
                        {MONTH_NAMES[date.getMonth()]} {date.getDate()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Grid table rows - one per team member */}
                <div className="flex-1 mt-4 space-y-3.5">
                  {users.map(user => {
                    const userColor = user.color || '#6366f1';

                    return (
                      <div 
                        key={user.id}
                        style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(7, minmax(0, 1fr))', gap: '12px', alignItems: 'center' }}
                        className="py-1.5 hover:bg-slate-50 dark:hover:bg-gray-800/50 dark:bg-obsidian-950 rounded-xl transition-all"
                      >
                        {/* Employee info */}
                        <div className="flex items-center gap-3 pl-2 min-w-0">
                          <div className="relative">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                              style={{ backgroundColor: userColor }}
                            >
                              {renderAvatar(user.avatar, user.name)}
                            </div>
                            {activeTimerMap[user.id] && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 border-2 border-white animate-pulse" />
                            )}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                            <p className="text-[9.5px] font-bold text-slate-400 dark:text-gray-500 truncate mt-0.5 leading-none">{user.role}</p>
                          </div>
                        </div>

                        {/* 7 daily cells */}
                        {weekDates.map(date => {
                          const dateStr = formatDateStr(date);
                          const summary = weekSummaries.get(dateStr);
                          const userData = summary?.userSummaries.find(us => us.userId === user.id);
                          
                          if (!userData || userData.totalSeconds === 0) {
                            return (
                              <div 
                                key={dateStr}
                                className="text-center p-3 rounded-2xl border border-slate-100 dark:border-gray-800/50 bg-slate-50 dark:bg-obsidian-950/50 text-slate-300 dark:text-gray-600 flex flex-col justify-center min-h-[60px]"
                              >
                                <span className="text-xs font-black tracking-tight leading-none">—</span>
                              </div>
                            );
                          }

                          const utilPct = Math.min(100, Math.round((userData.totalSeconds / (8 * 3600)) * 100));
                          let cellClass = 'bg-emerald-50 dark:bg-emerald-600 text-emerald-900 dark:text-white border-transparent shadow-sm font-black';
                          if (utilPct > 100) {
                            cellClass = 'bg-red-50/70 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-100 shadow-sm font-black';
                          } else if (utilPct > 90) {
                            cellClass = 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-sm font-black';
                          }

                          return (
                            <div 
                              key={dateStr}
                              className={`text-center p-3 rounded-2xl border transition-all flex flex-col justify-center min-h-[60px] ${cellClass}`}
                            >
                              <span className="text-xs font-black tracking-tight leading-none">{userData.totalFormatted}</span>
                              <span className={`text-[8.5px] font-black mt-1 ${utilPct > 100 ? 'text-red-600 dark:text-red-400' : utilPct > 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-700/80 dark:text-white/80'}`}>
                                {utilPct}%
                              </span>
                              {/* Show task count */}
                              <span className={`text-[7px] font-bold mt-0.5 ${utilPct > 90 ? 'text-slate-500 dark:text-gray-400' : 'text-emerald-700/60 dark:text-white/60'}`}>
                                {userData.tasks.length} task{userData.tasks.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          );
                        })}

                      </div>
                    );
                  })}
                </div>

                {/* Totals row */}
                <div 
                  style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(7, minmax(0, 1fr))', gap: '12px' }}
                  className="mt-6 pt-4 border-t border-slate-150 shrink-0"
                >
                  <div className="text-left font-black text-xs text-slate-700 dark:text-slate-300 dark:text-gray-600 uppercase tracking-widest pl-2">Total</div>
                  {weekDates.map(date => {
                    const dateStr = formatDateStr(date);
                    const summary = weekSummaries.get(dateStr);
                    return (
                      <div key={dateStr} className="text-center leading-none">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">{summary?.totalFormatted || '0h 0m'}</p>
                        <p className="text-[8.5px] font-bold text-slate-400 dark:text-gray-500 mt-1 uppercase">
                          {summary?.employeesWorked || 0} member{(summary?.employeesWorked || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6 border-t border-slate-100 dark:border-gray-800/50 dark:border-gray-800/50 pt-4 shrink-0">
                  <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Allocation Indicators:</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-emerald-50 dark:bg-emerald-500/100" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">Normal (&lt;= 90%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-emerald-50 dark:bg-emerald-500/10/70 border border-emerald-250" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">High (91% - 100%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-red-50/70 border border-red-200" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">Overloaded (&gt; 100%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded bg-slate-50 dark:bg-obsidian-950/50 border border-slate-150" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">No Allocation</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          }

        })()}

      </div>

    </div>
  );
};
