import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../utils/api';

import { useStore } from '../../store/useStore';

interface TaskTimerProps {
  taskId: string;
  projectId: string;
  onTimeUpdate?: () => void;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ taskId, projectId, onTimeUpdate }) => {
  const { currentUser, tasks } = useStore();
  const task = tasks.find(t => t.id === taskId);
  const isAssigned = currentUser && task && (
    task.assignees.includes(currentUser.id) ||
    currentUser.role === 'admin' ||
    currentUser.role === 'executive'
  );

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [loading, setLoading] = useState(true); // start as loading to prevent flicker
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<any[]>([]);
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/time-logs/task/${taskId}`);
      setLogs(res);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // api.get already unwraps response.data — so the result IS the status object
        const status = await api.get(`/time-logs/status/${taskId}`);
        if (status.status === 'active') {
          setIsActive(true);
          setIsPaused(false);
          const elapsed = Math.floor((new Date().getTime() - new Date(status.startTime).getTime()) / 1000);
          setAccumulatedTime(status.accumulatedTime);
          setTime(status.accumulatedTime + elapsed);
        } else if (status.status === 'paused') {
          setIsActive(true);
          setIsPaused(true);
          setTime(status.accumulatedTime);
          setAccumulatedTime(status.accumulatedTime);
        }
      } catch (err) {
        console.error('Error fetching timer status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    fetchLogs();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [taskId]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartClick = () => {
    setIsPickingDate(true);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await api.post('/time-logs/start', { taskId, projectId, workDate: selectedDate });
      setIsActive(true);
      setIsPaused(false);
      setIsPickingDate(false);
      setAccumulatedTime(0);
      setTime(0);
      await useStore.getState().fetchActiveTimer();
    } catch (err) {
      console.error('Error starting timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      await api.post('/time-logs/pause', { taskId });
      setIsPaused(true);
      setAccumulatedTime(time);
      await useStore.getState().fetchActiveTimer();
    } catch (err) {
      console.error('Error pausing timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      await api.post('/time-logs/resume', { taskId, projectId });
      setIsPaused(false);
      await useStore.getState().fetchActiveTimer();
    } catch (err) {
      console.error('Error resuming timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.post('/time-logs/stop', { taskId });
      setIsActive(false);
      setIsPaused(false);
      setTime(0);
      setAccumulatedTime(0);
      await fetchLogs();
      await useStore.getState().fetchActiveTimer();
      if (onTimeUpdate) onTimeUpdate();
    } catch (err) {
      console.error('Error stopping timer:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatedLogs = logs.reduce((acc, log) => {
    if (log.status === 'completed' || log.status === 'paused') {
      acc[log.workDate] = (acc[log.workDate] || 0) + (log.duration || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  if (isActive && !isPaused) {
    const elapsed = time - accumulatedTime;
    calculatedLogs[selectedDate] = (calculatedLogs[selectedDate] || 0) + Math.max(0, elapsed);
  }

  const uniqueDatesSet = new Set(Object.keys(calculatedLogs));
  const todayStr = new Date().toISOString().split('T')[0];
  uniqueDatesSet.add(todayStr);
  const uniqueDates = Array.from(uniqueDatesSet).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
      {/* History Panel */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} />
            Work Logs History
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={historyDate}
            onChange={(e) => setHistoryDate(e.target.value)}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date === todayStr ? 'Today' : date}</option>
            ))}
          </select>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {formatTime(calculatedLogs[historyDate] || 0)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isActive && !isPaused ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Tracker</p>
            <p className="text-lg font-mono font-bold text-gray-800 dark:text-gray-100 leading-tight">
              {loading ? '...:...:...' : formatTime(time)}
            </p>
          </div>
        </div>
        {isActive && (
          <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
             <Calendar size={10} />
             {selectedDate}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl" />
      ) : isPickingDate ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Work Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsPickingDate(false)}
              variant="outline"
              className="flex-1 text-xs py-1.5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={loading || !isAssigned}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 disabled:opacity-50"
            >
              Start Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {!isActive ? (
            <Button
              onClick={handleStartClick}
              disabled={loading || !isAssigned}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 disabled:opacity-50"
              icon={<Play size={14} fill="currentColor" />}
            >
              {isAssigned ? 'Start Timer' : 'Not Assigned'}
            </Button>
          ) : (
            <>
              <Button
                onClick={isPaused ? handleResume : handlePause}
                variant="outline"
                disabled={loading || !isAssigned}
                className={`flex-1 ${isPaused ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'} disabled:opacity-50`}
                icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                onClick={handleStop}
                disabled={loading || !isAssigned}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                icon={<Square size={14} fill="currentColor" />}
              >
                Stop
              </Button>
            </>
          )}
        </div>
      )}
      
      {isActive && !isPaused && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
          <AlertCircle size={10} />
          <span>Timer is running in the background</span>
        </div>
      )}
    </div>
  );
};
