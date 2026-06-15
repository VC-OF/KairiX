import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Plus,
  Download,
  Filter,
  MoreVertical,
  Timer,
  Target,
  Calendar,
  Search,
} from 'lucide-react';
import { useStore, Task } from '../../store/useStore';
import { api } from '../../utils/api';
import { format, parseISO } from 'date-fns';

export const GlobalTimeTracker: React.FC = () => {
  const { tasks, users, projects, currentUser, globalActiveTimer } = useStore();
  const [searchId, setSearchId] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;

    const found = tasks.find(t => 
      t.id === searchId || 
      t.id.toLowerCase().endsWith(searchId.toLowerCase()) || 
      t.title.toLowerCase().includes(searchId.toLowerCase())
    );
    if (found) {
      setActiveTask(found);
      fetchLogs(found.id);
      fetchTimerStatus(found.id);
    }
  };

  const fetchLogs = async (taskId: string) => {
    try {
      const res = await api.get(`/time-logs/task/${taskId}`);
      setLogs(res);
    } catch (err) {
      console.error('Failed to fetch task logs:', err);
    }
  };

  const fetchTimerStatus = async (taskId: string) => {
    try {
      const status = await api.get(`/time-logs/status/${taskId}`);
      if (status.status === 'active') {
        setIsActive(true);
        setIsPaused(false);
        const elapsed = Math.floor((new Date().getTime() - new Date(status.startTime).getTime()) / 1000);
        const totalSec = status.accumulatedTime + elapsed;
        setSeconds(totalSec);
        useStore.setState({
          globalActiveTimer: {
            taskId,
            taskTitle: activeTask?.title || 'Active Focus Task',
            isPaused: false,
            projectId: (activeTask as any).projectId || projects[0]?.id || 'project-1',
            seconds: totalSec,
            workDate: status.workDate || new Date().toISOString().split('T')[0]
          }
        });
      } else if (status.status === 'paused') {
        setIsActive(true);
        setIsPaused(true);
        setSeconds(status.accumulatedTime);
        useStore.setState({
          globalActiveTimer: {
            taskId,
            taskTitle: activeTask?.title || 'Active Focus Task',
            isPaused: true,
            projectId: (activeTask as any).projectId || projects[0]?.id || 'project-1',
            seconds: status.accumulatedTime,
            workDate: status.workDate || new Date().toISOString().split('T')[0]
          }
        });
      } else {
        setIsActive(false);
        setIsPaused(false);
        setSeconds(0);
      }
    } catch (err) {
      console.error('Error fetching timer status:', err);
    }
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  // Synchronize layout with globalActiveTimer store updates (e.g. from Sidebar HUD controls)
  useEffect(() => {
    if (activeTask) {
      const gTimer = useStore.getState().globalActiveTimer;
      if (gTimer && gTimer.taskId === activeTask.id) {
        setIsActive(true);
        setIsPaused(gTimer.isPaused);
        setSeconds(gTimer.seconds);
      } else if (!gTimer) {
        setIsActive(false);
        setIsPaused(false);
        setSeconds(0);
      }
    }
  }, [globalActiveTimer, activeTask]);

  const handleStart = async () => {
    if (!activeTask || loading) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/time-logs/start', { 
        taskId: activeTask.id, 
        projectId: (activeTask as any).projectId || projects[0]?.id, 
        workDate: todayStr 
      });
      setIsActive(true);
      setIsPaused(false);
      setSeconds(0);
      useStore.getState().setGlobalActiveTimer({
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        isPaused: false,
        projectId: (activeTask as any).projectId || projects[0]?.id || 'project-1',
        seconds: 0,
        workDate: todayStr
      });
    } catch (err) {
      console.error('Error starting timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activeTask || loading) return;
    setLoading(true);
    try {
      await api.post('/time-logs/pause', { taskId: activeTask.id });
      setIsPaused(true);
      const gTimer = useStore.getState().globalActiveTimer;
      if (gTimer) {
        useStore.getState().setGlobalActiveTimer({
          ...gTimer,
          isPaused: true,
          seconds
        });
      }
    } catch (err) {
      console.error('Error pausing timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!activeTask || loading) return;
    setLoading(true);
    try {
      await api.post('/time-logs/resume', { 
        taskId: activeTask.id, 
        projectId: (activeTask as any).projectId || projects[0]?.id 
      });
      setIsPaused(false);
      const gTimer = useStore.getState().globalActiveTimer;
      if (gTimer) {
        useStore.getState().setGlobalActiveTimer({
          ...gTimer,
          isPaused: false
        });
      }
    } catch (err) {
      console.error('Error resuming timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeTask || loading) return;
    setLoading(true);
    try {
      await api.post('/time-logs/stop', { taskId: activeTask.id });
      setIsActive(false);
      setIsPaused(false);
      setSeconds(0);
      await fetchLogs(activeTask.id);
      useStore.getState().setGlobalActiveTimer(null);
    } catch (err) {
      console.error('Error stopping timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const progress = (seconds % 3600) / 3600;

  // Stats calculation
  const totalDuration = logs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const todayLogs = logs.filter(l => l.workDate === new Date().toISOString().split('T')[0]);
  const todayDuration = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const stats = [
    {
      label: 'Today',
      value: formatDuration(todayDuration),
      trend: '+18%',
      color: 'text-emerald-400',
    },
    {
      label: 'Total Logged',
      value: formatDuration(totalDuration),
      trend: '+12%',
      color: 'text-cyan-400',
    },
    {
      label: 'Sessions',
      value: logs.length.toString(),
      trend: '+9%',
      color: 'text-violet-400',
    },
    {
      label: 'Status',
      value: activeTask ? activeTask.status : 'N/A',
      trend: '',
      color: 'text-amber-400',
    },
  ];

  const projectDetails = activeTask ? projects.find(p => p.id === (activeTask as any).projectId) : null;
  const assignedUsers = activeTask ? users.filter(u => activeTask.assignees.includes(u.id)) : [];
  const isAssigned = currentUser && activeTask && (
    activeTask.assignees.includes(currentUser.id) ||
    currentUser.role === 'admin' ||
    currentUser.role === 'executive'
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Timer className="w-7 h-7 text-white" />
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">
              TimeForge
            </h1>
            <p className="text-slate-400 text-sm -mt-1 font-medium">
              Professional Time Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl transition-all font-semibold text-sm shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl transition-all font-semibold text-sm shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Active Recording Strip */}
      {isActive && !isPaused && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-6 py-4 rounded-3xl flex items-center justify-between shadow-xl shadow-emerald-500/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-sm"></div>
            <span>
              Recording time for:{' '}
              <span className="opacity-90">{activeTask?.title || 'Unknown Task'}</span>
            </span>
          </div>

          <span className="font-mono text-2xl tracking-tight">
            {formatTime(seconds)}
          </span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Tracking Card + Session History */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Main Tracker Core Hero */}
          <div className="relative bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-slate-950 border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
              
              {/* Dial Wheel */}
              <div className="relative flex-shrink-0">
                <svg className="w-52 h-52 -rotate-12 drop-shadow-2xl" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    className="text-gray-100 dark:text-white/5"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="8"
                    strokeDasharray="339"
                    strokeDashoffset={339 - (progress * 339)}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.4))',
                      transition: 'stroke-dashoffset 1s linear'
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-bold tracking-[3px] text-slate-400 mb-1 uppercase">
                    Elapsed
                  </div>

                  <div className="text-3xl font-bold font-mono text-gray-900 dark:text-white tracking-tighter">
                    {formatTime(seconds)}
                  </div>

                  <div
                    className={`mt-3 px-3 py-1 rounded-full text-[9px] font-black tracking-wider flex items-center gap-1.5 shadow-sm ${
                      isActive && !isPaused
                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive && !isPaused
                          ? 'bg-emerald-500 animate-ping'
                          : 'bg-slate-400'
                      }`}
                    />
                    {isActive && !isPaused ? 'LIVE' : isPaused ? 'PAUSED' : 'READY'}
                  </div>
                </div>
              </div>

              {/* Task Details & Action Panel */}
              <div className="flex-1 w-full">
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-500 dark:text-violet-400 mb-1.5 tracking-widest uppercase">
                    <Target className="w-4 h-4" /> Current Task
                  </div>

                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {activeTask?.title || 'Select a Task to Focus'}
                  </h2>

                  <p className="text-slate-400 mt-1 font-mono text-xs">
                    ID: <span className="text-violet-500 dark:text-violet-300 font-bold">{activeTask?.id || '—'}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-transparent">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project</p>
                    <p className="font-bold text-gray-800 dark:text-white mt-1 text-sm truncate">{projectDetails?.name || 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-transparent">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</p>
                    <div className="flex items-center gap-2 mt-1">
                      {assignedUsers.length > 0 ? (
                         <>
                           <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                             {assignedUsers[0].name.split(' ').map(n => n[0]).join('')}
                           </div>
                           <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{assignedUsers[0].name}</p>
                         </>
                      ) : (
                        <p className="font-bold text-gray-500 text-sm italic">Unassigned</p>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="mb-5 relative group">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="h-14 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl px-5 font-mono text-sm focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 w-full pr-16 transition-all dark:text-white"
                    placeholder="Enter Task ID or search title..."
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 active:scale-95">
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex gap-4">
                  {!isActive ? (
                    <button
                      onClick={handleStart}
                      disabled={!activeTask || loading || !isAssigned}
                      className="flex-1 h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl shadow-violet-500/20 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      {!isAssigned && activeTask ? 'Not Assigned' : loading ? 'Starting...' : 'Start Tracking'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={isPaused ? handleResume : handlePause}
                        disabled={loading || !isAssigned}
                        className={`flex-1 h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl ${
                          isPaused
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20'
                        } hover:brightness-110 disabled:opacity-50`}
                      >
                        {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                        {loading ? 'Processing...' : isPaused ? 'Resume Session' : 'Pause Session'}
                      </button>

                      <button
                        onClick={handleStop}
                        disabled={loading || !isAssigned}
                        className="h-14 w-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 border-2 border-gray-100 dark:border-white/10 transition-all active:scale-95 flex items-center justify-center group disabled:opacity-50"
                      >
                        <Square className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Session History Table */}
          <div className="bg-white dark:bg-[#0c1018] border border-gray-150 dark:border-gray-850 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-500/10 rounded-2xl">
                  <Calendar className="w-6 h-6 text-violet-500" />
                </div>

                <div>
                  <h3 className="font-black text-xl text-gray-900 dark:text-white">
                    Work Session History
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Total tracked sessions: {logs.length}
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-500 px-5 py-2.5 rounded-2xl shadow-sm">
                {todayLogs.length} today
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 border-b border-gray-50 dark:border-white/5 uppercase tracking-[2px]">
                    <th className="text-left pl-8 py-5">Date</th>
                    <th className="text-left py-5">Team Member</th>
                    <th className="text-left py-5">Session Time</th>
                    <th className="text-left py-5">Duration</th>
                    <th className="text-left py-5">Status</th>
                    <th className="pr-8"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {logs.map((log, i) => (
                    <tr
                      key={log._id || i}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
                    >
                      <td className="pl-8 py-5 font-mono text-sm font-bold text-gray-600 dark:text-slate-400">
                        {log.workDate}
                      </td>

                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-md shrink-0">
                             {log.userId?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{log.userId?.name || 'Unknown User'}</span>
                        </div>
                      </td>

                      <td className="py-5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {format(parseISO(log.startTime), 'hh:mm a')} — {log.endTime ? format(parseISO(log.endTime), 'hh:mm a') : 'Now'}
                      </td>

                      <td className="py-5">
                        <div className="font-mono font-black text-violet-500 dark:text-violet-400 text-sm">
                          {log.status === 'active' ? (
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              Running
                            </span>
                          ) : formatDuration(log.duration)}
                        </div>
                      </td>

                      <td className="py-5">
                        <span className={`px-4 py-1.5 text-[9px] rounded-xl font-black uppercase tracking-widest shadow-sm ${
                          log.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          log.status === 'paused' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      <td className="pr-8 text-right">
                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-gray-900 dark:hover:text-white shadow-sm">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                     <tr>
                       <td colSpan={6} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-3 opacity-30">
                           <Timer className="w-12 h-12" />
                           <p className="text-sm font-black uppercase tracking-widest">No activity recorded</p>
                         </div>
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Symmetrical Metadata + Stacked 2x2 Symmetrical Stats Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Active Workspace / Project Card */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mb-4">
              Current Project
            </h3>

            <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-transparent">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md shrink-0">
                {projectDetails?.name?.[0] || '🚀'}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{projectDetails?.name || 'No Project'}</p>
                <p className="text-xs text-slate-400 truncate font-medium">
                  {projectDetails?.description || 'Active workspace'}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Focus Card */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mb-4">
              Today's Focus
            </h3>

            <div className="space-y-4">
              {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-3 text-sm cursor-pointer group" 
                  onClick={() => { setSearchId(task.id); handleSearch(); }}
                >
                  <div className="w-2 h-2 rounded-full bg-violet-500 group-hover:scale-125 transition-transform" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-violet-500 transition-colors truncate">
                    {task.title}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-slate-500 italic">No pending tasks</p>}
            </div>

            <button className="mt-6 w-full py-3 text-xs font-bold border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 hover:border-violet-500/50 hover:text-violet-500 transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
              <Plus className="w-4 h-4" /> Add Focus Item
            </button>
          </div>

          {/* Symmetrical Stats Panel - Balanced 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[1.5rem] p-5 hover:border-violet-500/30 transition-all group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    {stat.trend && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-current bg-opacity-10 ${stat.color}`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-black mt-2 font-mono text-gray-900 dark:text-white leading-none">
                    {stat.value}
                  </p>
                </div>

                <div className="h-1 bg-gray-100 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
