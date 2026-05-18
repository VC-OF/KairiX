import React, { useState } from 'react';
import { useStore, DailyLog } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import {
  Plus,
  Calendar,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  History,
  Activity
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

const LogForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  log?: DailyLog;
}> = ({ isOpen, onClose, log }) => {
  const { addLog, updateLog, currentUser, tasks } = useStore();
  const [date, setDate] = useState(log?.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(log?.content || '');
  const [blockers, setBlockers] = useState(log?.blockers || '');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(log?.completedTasks || []);

  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const toggleTask = (id: string) => {
    setSelectedTasks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (log) {
      updateLog(log.id, { date, content, blockers, completedTasks: selectedTasks });
    } else {
      addLog({
        date,
        userId: currentUser?.id || 'user-1',
        content,
        completedTasks: selectedTasks,
        blockers,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={log ? 'Edit Log Entry' : 'Share Progress'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Work Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BookOpen size={12} /> Progress Update
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your achievements today..."
            rows={5}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-violet-500 resize-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={12} /> Blockers or Issues
          </label>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Mention anything slowing you down..."
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border-2 border-amber-100/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none transition-all"
          />
        </div>

        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <CheckSquare size={12} /> Linked Tasks
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {completedTasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedTasks.includes(task.id)
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => toggleTask(task.id)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedTasks.includes(task.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                  }`}>
                    {selectedTasks.includes(task.id) && <Plus size={10} className="text-white rotate-45" />}
                  </div>
                  <span className="text-xs font-bold truncate">{task.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 rounded-2xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {log ? 'Update Log' : 'Publish Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const LogCard: React.FC<{ log: DailyLog }> = ({ log }) => {
  const { users, tasks, deleteLog, currentUser } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const author = users.find((u) => u.id === log.userId);
  const linkedTasks = tasks.filter((t) => log.completedTasks.includes(t.id));
  const isOwner = currentUser?.id === log.userId || currentUser?.role === 'admin';




  return (
    <>
      <div className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-violet-500/30 transition-all duration-500 overflow-hidden relative">
        <div className="flex items-start gap-4 p-6 md:p-8">
          <div className="flex-shrink-0 relative">
            {author && <Avatar user={author} size="lg" />}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center ${
              log.blockers ? 'bg-amber-500' : 'bg-emerald-500'
            }`}>
              {log.blockers ? <AlertTriangle size={8} className="text-white" /> : <Plus size={8} className="text-white" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {author?.name || 'Unknown'}
                  {author?.role === 'admin' && (
                    <span className="text-[10px] font-black bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Admin</span>
                  )}
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                  <History size={10} /> {format(parseISO(log.createdAt), 'h:mm a')}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {isOwner && (
                  <>
                    <button
                      onClick={() => setShowEdit(true)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600 transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative mt-4">
              <div className="absolute left-[-2rem] top-0 bottom-0 w-1 bg-gradient-to-b from-violet-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all" />
              <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium ${!expanded ? 'line-clamp-3' : ''}`}>
                {log.content}
              </p>
            </div>

            {/* Blockers Section */}
            {log.blockers && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-2xl rounded-tl-none">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-[2px]">Blocker Identified</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400/80 font-bold leading-relaxed">{log.blockers}</p>
              </div>
            )}

            {/* Completed Tasks */}
            {linkedTasks.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievements</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {linkedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expander */}
            <div className="mt-6 flex justify-center">
               <button 
                onClick={() => setExpanded(!expanded)}
                className="group/btn px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center gap-2"
               >
                 {expanded ? 'Collapse Report' : 'Show Full Update'}
                 {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
               </button>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <LogForm isOpen={showEdit} onClose={() => setShowEdit(false)} log={log} />
      )}
    </>
  );
};

export const DailyLogs: React.FC = () => {
  const { dailyLogs, users, project } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('all');

  const filteredLogs = dailyLogs
    .filter((l) => filterUser === 'all' || l.userId === filterUser)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const grouped: Record<string, DailyLog[]> = {};
  filteredLogs.forEach((log) => {
    if (!grouped[log.date]) grouped[log.date] = [];
    grouped[log.date].push(log);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-10 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-violet-600 rounded-2xl shadow-lg shadow-violet-600/20 text-white">
              <Activity size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Operational Logs
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Project pulse: <span className="text-violet-600 font-bold">{project.name}</span> activity timeline
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 pl-3">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="text-xs font-black uppercase tracking-wider border-none bg-transparent focus:ring-0 text-slate-600 dark:text-slate-400 py-2"
            >
              <option value="all">Every Member</option>
              {users.filter(u => (project.members || []).includes(u.id)).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            Log Entry
          </button>
        </div>
      </div>

      {/* Logs Timeline */}
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <BookOpen size={40} className="text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Reports Recorded</h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">Your activity stream is currently empty. Start the cycle by publishing your first log.</p>
          <button 
            onClick={() => setShowAdd(true)}
            className="mt-8 px-8 py-4 rounded-2xl border-2 border-violet-600 text-violet-600 text-xs font-black uppercase tracking-[3px] hover:bg-violet-600 hover:text-white transition-all"
          >
            Initiate Stream
          </button>
        </div>
      ) : (
        <div className="space-y-12 relative">
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-100 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800 dark:to-transparent" />
          
          {sortedDates.map((date) => {
            const logDate = parseISO(date);
            const dateLabel = isToday(logDate)
              ? 'Chronicle: Today'
              : isYesterday(logDate)
              ? 'Chronicle: Yesterday'
              : format(logDate, 'EEEE, MMMM d');

            return (
              <div key={date} className="relative z-10 pl-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{dateLabel}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                      {grouped[date].length} Operational {grouped[date].length > 1 ? 'Updates' : 'Update'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pl-0 md:pl-12">
                  {grouped[date].map((log) => (
                    <LogCard key={log.id} log={log} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <LogForm isOpen={showAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
};
