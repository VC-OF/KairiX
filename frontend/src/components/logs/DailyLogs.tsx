import React, { useState, useEffect } from 'react';
import { useStore, DailyLog } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { ThreadedComment, Reply } from './ThreadedComment';
import {
  Plus,
  Calendar,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Award,
  Share2,
  Bookmark,
  Users,
  Info,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

// ═══════════════════════ NEW LOG MODAL FORM ═══════════════════════
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
    <Modal isOpen={isOpen} onClose={onClose} title={log ? 'Edit Status Post' : 'Submit Progress Update'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Work Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-all font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <BookOpen size={12} /> Progress Update Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your achievements today..."
            rows={5}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 resize-none transition-all"
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
              <CheckSquare size={12} /> Linked Achievements
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
            className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {log ? 'Update Post' : 'Post Progress'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════ REDDIT POST CARD OVERHAUL ═══════════════════════
interface LogCardProps {
  log: DailyLog;
  threadData: { score: number; userVote: 'up' | 'down' | null; comments: Reply[] };
  onPostVote: (logId: string, direction: 'up' | 'down') => void;
  onCommentVote: (logId: string, commentId: string, direction: 'up' | 'down') => void;
  onAddCommentReply: (logId: string, parentCommentId: string | null, content: string) => void;
}

const LogCard: React.FC<LogCardProps> = ({ 
  log, 
  threadData,
  onPostVote,
  onCommentVote,
  onAddCommentReply
}) => {
  const { users, tasks, deleteLog, currentUser, project } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [newRootCommentText, setNewRootCommentText] = useState('');

  const author = users.find((u) => u.id === log.userId);
  const linkedTasks = tasks.filter((t) => log.completedTasks.includes(t.id));
  const isOwner = currentUser?.id === log.userId || currentUser?.role === 'admin';

  const handleRootCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRootCommentText.trim()) return;
    onAddCommentReply(log.id, null, newRootCommentText);
    setNewRootCommentText('');
  };

  const usernameHandle = `u/${author?.name.toLowerCase().replace(/\s+/g, '_') || 'unknown'}`;
  const subredditHandle = `r/${project.name.replace(/\s+/g, '')}`;

  return (
    <>
      <div className="group bg-white dark:bg-[#0c1018] rounded-[2rem] border border-gray-150 dark:border-gray-850 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all duration-500 overflow-hidden flex relative select-none">
        
        {/* Left Side: Score Upvoting Rail */}
        <div className="w-14 bg-gray-50/50 dark:bg-black/10 flex flex-col items-center py-5 border-r border-gray-100 dark:border-gray-850 shrink-0">
          <button 
            onClick={() => onPostVote(log.id, 'up')}
            className={`p-1 rounded-lg transition-all duration-150 active:scale-125 cursor-pointer ${
              threadData.userVote === 'up' 
                ? 'text-[#ff4500]' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <ArrowBigUp size={24} fill={threadData.userVote === 'up' ? 'currentColor' : 'none'} />
          </button>
          
          <span className={`text-xs font-black my-1 ${
            threadData.userVote === 'up' 
              ? 'text-[#ff4500]' 
              : threadData.userVote === 'down' 
                ? 'text-[#7193ff]' 
                : 'text-gray-600 dark:text-gray-400'
          }`}>
            {threadData.score}
          </span>
          
          <button 
            onClick={() => onPostVote(log.id, 'down')}
            className={`p-1 rounded-lg transition-all duration-150 active:scale-125 cursor-pointer ${
              threadData.userVote === 'down' 
                ? 'text-[#7193ff]' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <ArrowBigDown size={24} fill={threadData.userVote === 'down' ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Right Side: Post content */}
        <div className="flex-1 p-6 md:p-8 min-w-0">
          {/* Post Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                {author && <Avatar user={author} size="sm" />}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${
                  log.blockers ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              </div>
              
              <div className="leading-tight truncate">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-black text-gray-800 dark:text-gray-200 hover:underline cursor-pointer">{subredditHandle}</span>
                  <span className="text-gray-400 dark:text-gray-600 font-bold">•</span>
                  <span className="text-gray-400 dark:text-gray-500 font-bold">Posted by {usernameHandle}</span>
                  {author?.role === 'admin' && (
                    <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded uppercase tracking-wide">MOD</span>
                  )}
                </div>
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest mt-1">
                  {format(parseISO(log.createdAt), 'h:mm a')}
                </p>
              </div>
            </div>

            {/* Owner Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-gray-400 hover:text-indigo-600 transition-all cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-gray-400 hover:text-rose-500 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="relative mt-2 pl-0.5">
            <p className="text-sm text-gray-700 dark:text-slate-205 leading-relaxed font-semibold">
              {log.content}
            </p>
          </div>

          {/* Blockers */}
          {log.blockers && (
            <div className="mt-4 p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3">
              <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
              <div>
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-0.5">Blocker Identified</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">{log.blockers}</p>
              </div>
            </div>
          )}

          {/* Connected Achievements */}
          {linkedTasks.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mr-1">Linked Tasks:</span>
              {linkedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-xl text-[9px] font-black uppercase tracking-wider"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {task.title}
                </div>
              ))}
            </div>
          )}

          {/* Post Footer Controls */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-850/60 text-[10px] text-gray-400 font-black uppercase tracking-wider">
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                showComments ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MessageSquare size={13} />
              <span>{threadData.comments.length} Comments</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
              <Award size={13} />
              <span>Award</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
              <Share2 size={13} />
              <span>Share</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
              <Bookmark size={13} />
              <span>Save</span>
            </button>
          </div>

          {/* Collapsible Reddit Thread Nested Comments */}
          {showComments && (
            <div className="mt-5 space-y-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-850/60">
              
              {/* Recursive comments list */}
              {threadData.comments.length > 0 ? (
                <div className="space-y-4">
                  {threadData.comments.map((comment) => (
                    <ThreadedComment
                      key={comment.id}
                      comment={comment}
                      onAddReply={(parentCommentId, text) => onAddCommentReply(log.id, parentCommentId, text)}
                      onVote={(commentId, dir) => onCommentVote(log.id, commentId, dir)}
                      depth={0}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic py-2">No comments yet. Be the first to reply!</p>
              )}

              {/* Add Root Comment Form */}
              <form onSubmit={handleRootCommentSubmit} className="mt-4 flex gap-2 items-stretch">
                <textarea
                  value={newRootCommentText}
                  onChange={(e) => setNewRootCommentText(e.target.value)}
                  placeholder="Share a status reply or ask a question..."
                  rows={1}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-205 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                />
                <button
                  type="submit"
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                >
                  Comment
                </button>
              </form>

            </div>
          )}

        </div>
      </div>

      {showEdit && (
        <LogForm isOpen={showEdit} onClose={() => setShowEdit(false)} log={log} />
      )}
    </>
  );
};

// ═══════════════════════ MAIN SUBREDDIT FEED OVERVIEW ═══════════════════════
export const DailyLogs: React.FC = () => {
  const { 
    dailyLogs, 
    users, 
    project, 
    currentUser, 
    voteLogPost, 
    voteLogComment, 
    addLogComment,
    logPage,
    totalLogs,
    logLimit,
    setLogPage,
    fetchLogs
  } = useStore();
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

  const subredditName = `r/${project.name.replace(/\s+/g, '')}`;

  return (
    <div className="space-y-8 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Community Subreddit Banner */}
      <div className="relative h-28 w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-3xl overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/35 backdrop-blur-[1px]" />
        <div className="absolute bottom-4 left-6 flex items-center gap-4 text-white">
          <div className="w-14 h-14 bg-indigo-600 border-4 border-white dark:border-obsidian-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
            KX
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              {subredditName}
            </h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-100/80">
              KairiX Workspace operational stream
            </p>
          </div>
        </div>
      </div>

      {/* Main Reddit Grid Layout (Feed + Subreddit widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Post Feed (70% width) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Feed Filter Header bar */}
          <div className="bg-white dark:bg-[#0c1018] p-3 rounded-2xl border border-gray-150 dark:border-gray-850 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-3 bg-gray-50 dark:bg-black/20 border border-gray-155 dark:border-gray-850 rounded-xl w-full sm:w-auto">
              <Filter size={13} className="text-gray-400" />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="text-[10px] font-black uppercase tracking-wider border-none bg-transparent focus:ring-0 text-gray-550 dark:text-gray-400 py-2 cursor-pointer outline-none"
              >
                <option value="all">r/All Logs</option>
                {users.filter(u => (project.members || []).includes(u.id)).map((u) => (
                  <option key={u.id} value={u.id}>u/{u.name.toLowerCase().replace(/\s+/g, '_')}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Create Status Post</span>
            </button>
          </div>

          {/* Chronicle Dates Timeline */}
          {sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#0c1018] rounded-3xl border border-gray-150 dark:border-gray-850 p-8 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-5 animate-pulse">
                <BookOpen size={36} className="text-gray-300 dark:text-gray-700" />
              </div>
              <h3 className="text-lg font-black text-gray-950 dark:text-white mb-1.5">No Posts Shared Yet</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto font-medium">Your subreddit feed is currently blank. Be the first to share your status update with the community!</p>
              <button 
                onClick={() => setShowAdd(true)}
                className="mt-6 px-6 py-3 rounded-2xl border-2 border-indigo-600 text-indigo-650 dark:text-indigo-400 text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
              >
                Initiate Chronicle
              </button>
            </div>
          ) : (
            <div className="space-y-10 relative">
              {sortedDates.map((date) => {
                const logDate = parseISO(date);
                const dateLabel = isToday(logDate)
                  ? 'Chronicle: Today'
                  : isYesterday(logDate)
                  ? 'Chronicle: Yesterday'
                  : format(logDate, 'EEEE, MMMM d');

                return (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-850" />
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap bg-gray-50 dark:bg-[#080b12] px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-800">
                        {dateLabel}
                      </span>
                      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-850" />
                    </div>
                    
                    <div className="space-y-5">
                      {grouped[date].map((log) => {
                        const threadData = log.thread || { score: 1, userVote: null, comments: [] };
                        return (
                          <LogCard 
                            key={log.id} 
                            log={log} 
                            threadData={threadData}
                            onPostVote={voteLogPost}
                            onCommentVote={voteLogComment}
                            onAddCommentReply={addLogComment}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalLogs > logLimit && (
                <div className="flex items-center justify-between bg-white dark:bg-[#0c1018] p-4 rounded-3xl border border-gray-150 dark:border-gray-850 shadow-sm mt-6">
                  <button
                    disabled={logPage === 1}
                    onClick={() => {
                      setLogPage(logPage - 1);
                      fetchLogs(project.id, logPage - 1);
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-bold">
                    Page {logPage} of {Math.ceil(totalLogs / logLimit)}
                  </span>
                  <button
                    disabled={logPage >= Math.ceil(totalLogs / logLimit)}
                    onClick={() => {
                      setLogPage(logPage + 1);
                      fetchLogs(project.id, logPage + 1);
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Subreddit Sidebar Widgets (30% width) */}
        <div className="col-span-1 space-y-6 hidden lg:block">
          
          {/* About Community Card */}
          <div className="bg-white dark:bg-[#0c1018] rounded-3xl border border-gray-150 dark:border-gray-850 shadow-sm overflow-hidden select-none">
            <div className="px-5 py-4 bg-gray-50 dark:bg-black/20 border-b border-gray-150 dark:border-gray-850 flex items-center gap-2 text-gray-900 dark:text-white font-extrabold text-sm">
              <Info size={16} className="text-indigo-500" />
              <span>About Community</span>
            </div>
            <div className="p-5 space-y-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <p className="leading-relaxed">
                Welcome to <span className="font-extrabold text-gray-800 dark:text-gray-200">{subredditName}</span>! This is the central operational stream where the team publishes daily reports, links achievements, and resolves engineering blockers collaboratively.
              </p>
              
              <div className="grid grid-cols-2 gap-3 border-y border-gray-100 dark:border-gray-850/60 py-3.5">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Created</span>
                  <span className="font-black text-gray-850 dark:text-gray-200">May 13, 2026</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Visibility</span>
                  <span className="font-black text-gray-850 dark:text-gray-200 capitalize">{project.visibility || 'Public'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-extrabold uppercase">
                <Users size={12} />
                <span>{users.filter(u => (project.members || []).includes(u.id)).length} Active Members</span>
              </div>
            </div>
          </div>

          {/* operational rules card */}
          <div className="bg-white dark:bg-[#0c1018] rounded-3xl border border-gray-150 dark:border-gray-850 shadow-sm overflow-hidden select-none">
            <div className="px-5 py-4 bg-gray-50 dark:bg-black/20 border-b border-gray-150 dark:border-gray-850 flex items-center gap-2 text-gray-900 dark:text-white font-extrabold text-sm">
              <ShieldCheck size={16} className="text-[#ff4500]" />
              <span>Community Posting Rules</span>
            </div>
            <div className="p-5 space-y-3.5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              <div className="flex gap-2">
                <span className="text-gray-400">1.</span>
                <p><span className="font-black text-gray-850 dark:text-gray-200 block mb-0.5">Publish Logs Daily</span>Status updates keep clients and managers aligned on estimation workloads.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400">2.</span>
                <p><span className="font-black text-gray-850 dark:text-gray-200 block mb-0.5">Link Achievements</span>Check and link completed task cards to prove progress visually.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400">3.</span>
                <p><span className="font-black text-gray-850 dark:text-gray-200 block mb-0.5">Flag Blockers Immediately</span>Specify active project bottlenecks clearly inside the blockers textarea.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400">4.</span>
                <p><span className="font-black text-gray-850 dark:text-gray-200 block mb-0.5">Be Constructive in Threads</span>Collaborate kindly. Upvote useful updates and answer blocker threads.</p>
              </div>
            </div>
          </div>

          {/* moderators card */}
          <div className="bg-white dark:bg-[#0c1018] rounded-3xl border border-gray-150 dark:border-gray-850 shadow-sm overflow-hidden select-none">
            <div className="px-5 py-4 bg-gray-50 dark:bg-black/20 border-b border-gray-150 dark:border-gray-850 flex items-center gap-2 text-gray-900 dark:text-white font-extrabold text-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Channel Moderators</span>
            </div>
            <div className="p-4 space-y-2.5">
              {users.filter(u => u.role === 'admin' || u.role === 'executive').map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gray-50/50 dark:bg-black/10 px-3.5 py-2 border border-gray-100 dark:border-gray-850 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar user={u} size="xs" />
                    <span className="text-xs font-black text-gray-800 dark:text-gray-200 truncate">u/{u.name.toLowerCase().replace(/\s+/g, '_')}</span>
                  </div>
                  <span className="text-[8px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-250/20 px-1.5 py-0.5 rounded shadow-sm shrink-0">MOD</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {showAdd && <LogForm isOpen={showAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
};
