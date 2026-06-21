import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import {
  CheckCircle2,
  MessageSquare,
  AtSign,
  Clock,
  Settings,
  Archive,
  ListTodo,
  MoreHorizontal,
  Bell,
  ArrowRight,
  AlertCircle,
  Info,
  ClipboardList,
  AlertTriangle,
  Plus,
  Minus,
  Check,
  Users,
  TrendingUp,
  User
} from 'lucide-react';

interface NotificationsPanelProps {
  notifications: any[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  onClose: () => void;
  onNotificationClick: (notification: any) => void;
  onSettingsClick: () => void;
}

type FilterType = 'All' | 'Unread' | 'Tasks' | 'Mentions' | 'Comments';

const AvatarWithFallback: React.FC<{ user: any }> = ({ user }) => {
  const [hasError, setHasError] = useState(false);

  if (user && user.avatar && !hasError) {
    return (
      <img
        src={user.avatar}
        className="w-5 h-5 rounded-full object-cover shrink-0"
        alt={user?.name || 'User'}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 shrink-0">
      <User size={11} className="text-purple-500 dark:text-purple-400" />
    </div>
  );
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  unreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  onClose,
  onNotificationClick,
  onSettingsClick,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [viewMode, setViewMode] = useState<'feed' | 'overview'>('overview');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Today: true,
    Yesterday: true,
    Earlier: true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getNotificationCategory = (n: any) => {
    const title = (n.title || '').toLowerCase();
    const type = (n.type || '').toLowerCase();
    if (type === 'mention' || title.includes('mention') || title.includes('@')) return 'Mention';
    if (title.includes('assigned') || title.includes('new task')) return 'Task Assigned';
    if (title.includes('completed') || title.includes('done')) return 'Task Completed';
    if (title.includes('comment')) return 'Comment';
    if (title.includes('due') || title.includes('deadline')) return 'Due Soon';
    if (title.includes('warn') || title.includes('error') || title.includes('fail')) return 'Warning/Error';
    return 'System Alert';
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Task Assigned':
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: ListTodo };
      case 'Task Completed':
        return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 };
      case 'Mention':
        return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: AtSign };
      case 'Comment':
        return { color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: MessageSquare };
      case 'Due Soon':
        return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Clock };
      case 'Warning/Error':
        return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle };
      default:
        return { color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Info };
    }
  };

  const tasksMentionedCount = useMemo(() => notifications.filter(n => !n.read && getNotificationCategory(n) === 'Mention').length, [notifications]);
  const overdueTasksCount = useMemo(() => notifications.filter(n => !n.read && getNotificationCategory(n) === 'Due Soon').length, [notifications]);
  
  const membersCount = useMemo(() => notifications.filter(n => {
    if (n.read) return false;
    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();
    return n.type === 'project' || title.includes('member') || msg.includes('member') || title.includes('added') || title.includes('removed');
  }).length, [notifications]);

  const workflowUpdatesCount = useMemo(() => notifications.filter(n => {
    if (n.read) return false;
    const cat = getNotificationCategory(n);
    return cat === 'Task Assigned' || cat === 'Task Completed' || cat === 'Comment' || n.type === 'task' || (n.title || '').toLowerCase().includes('status');
  }).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Unread') return !n.read;
      
      const cat = getNotificationCategory(n);
      if (activeFilter === 'Tasks') return cat.includes('Task');
      if (activeFilter === 'Mentions') return cat === 'Mention';
      if (activeFilter === 'Comments') return cat === 'Comment';
      return true;
    });
  }, [notifications, activeFilter]);

  const dynamicTaskMentions = useMemo(() => {
    return notifications.filter(n => getNotificationCategory(n) === 'Mention');
  }, [notifications]);

  const dynamicOverdue = useMemo(() => {
    return notifications.filter(n => getNotificationCategory(n) === 'Due Soon');
  }, [notifications]);

  const dynamicMembers = useMemo(() => {
    return notifications.filter(n => 
      n.type === 'project' || 
      (n.title || '').toLowerCase().includes('member') || 
      (n.message || '').toLowerCase().includes('member') || 
      (n.message || '').toLowerCase().includes('added') || 
      (n.message || '').toLowerCase().includes('removed')
    );
  }, [notifications]);

  const dynamicWorkflow = useMemo(() => {
    return notifications.filter(n => 
      getNotificationCategory(n) === 'Task Assigned' || 
      getNotificationCategory(n) === 'Task Completed' || 
      getNotificationCategory(n) === 'Comment' || 
      n.type === 'task' || 
      (n.title || '').toLowerCase().includes('status')
    );
  }, [notifications]);

  const findUserByMessage = (message: string) => {
    const { users } = useStore.getState();
    return users.find(u => message.startsWith(u.name));
  };

  const getUserDisplayName = (n: any) => {
    const user = findUserByMessage(n.message);
    if (user) return user.name;
    const verbs = ['moved', 'commented', 'assigned', 'updated', 'added', 'removed', 'joined'];
    for (const verb of verbs) {
      const idx = n.message.indexOf(' ' + verb);
      if (idx !== -1) {
        return n.message.substring(0, idx).trim();
      }
    }
    return 'A team member';
  };

  const renderUserAvatar = (user: any, initials?: string) => {
    return <AvatarWithFallback user={user} />;
  };

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredNotifications.forEach(n => {
      const date = new Date(n.createdAt);
      if (date >= today) {
        groups.Today.push(n);
      } else if (date >= yesterday) {
        groups.Yesterday.push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const renderFilterChip = (label: FilterType, count?: number) => (
    <button
      onClick={() => setActiveFilter(label)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        activeFilter === label
          ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-accent-muted)]'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
          activeFilter === label ? 'bg-[var(--theme-accent)] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div
        className="fixed right-4 top-16 mt-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 rounded-[20px] shadow-2xl z-30 overflow-hidden flex flex-col max-h-[85vh] animate-dropdown transition-all duration-300 left-4 right-4 md:left-auto md:w-[720px] lg:w-[960px]"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/40">
          {/* Row 1: Title and Mark Read */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Bell size={20} className="text-[var(--theme-accent)] shrink-0" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight truncate">Notification Center</h3>
              {unreadCount > 0 && viewMode === 'feed' && (
                <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-bold border border-green-500/20 whitespace-nowrap shrink-0">
                  {unreadCount} New
                </span>
              )}
            </div>

            {viewMode === 'feed' && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[var(--theme-accent)] transition-colors flex items-center gap-1 shrink-0"
              >
                <CheckCircle2 size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Row 2: View Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100/85 dark:bg-gray-800/85 p-1 rounded-xl w-full">
              <button
                onClick={() => setViewMode('overview')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'overview'
                    ? 'bg-white dark:bg-gray-700 text-[var(--theme-accent)] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Overview Board
              </button>
              <button
                onClick={() => setViewMode('feed')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'feed'
                    ? 'bg-white dark:bg-gray-700 text-[var(--theme-accent)] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Live Feed
              </button>
            </div>
          </div>

          {/* Filters - only visible in feed mode */}
          {viewMode === 'feed' && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mt-3">
              {renderFilterChip('All')}
              {renderFilterChip('Unread', unreadCount)}
              {renderFilterChip('Tasks')}
              {renderFilterChip('Mentions')}
              {renderFilterChip('Comments')}
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'overview' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">


            {/* 2. Side by Side Detailed Columns (Second Image style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Column 1: Tasks / Mention in Daily Logs */}
              <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-950/30 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-950 dark:text-blue-200">Tasks</h4>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Mention in Daily Logs</p>
                    </div>
                  </div>

                  {/* Daily Log list */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {dynamicTaskMentions.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-center">No task mentions logged yet.</p>
                    ) : (
                      dynamicTaskMentions.map((n) => {
                        const user = findUserByMessage(n.message);
                        const initials = user ? user.name.split(' ').map((x: any) => x[0]).join('').toUpperCase() : '??';
                        return (
                          <div key={n._id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
                            <div className="flex items-center gap-2">
                              {renderUserAvatar(user, initials)}
                              <p className="text-[11px] font-black text-gray-800 dark:text-gray-200">{getUserDisplayName(n)}</p>
                            </div>
                            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-tight">{n.message}</p>
                            <p className="text-[8px] text-gray-400">{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bottom bullet points */}
                <div className="space-y-1.5 pt-3 border-t border-blue-100/50 dark:border-blue-950/20">
                  {[
                    'Mention tasks in your daily logs',
                    'Track what you worked on',
                    'Maintain clear work records',
                    'Improve transparency & accountability'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-blue-800/80 dark:text-blue-300/80 font-bold">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Task Overdue */}
              <div className="bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/30 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-orange-950 dark:text-orange-200">Task Overdue</h4>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">Overdue Tasks</p>
                    </div>
                  </div>

                  {/* Overdue Tasks List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {dynamicOverdue.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-center">No overdue tasks logged yet.</p>
                    ) : (
                      dynamicOverdue.map((n) => (
                        <div key={n._id} className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 truncate">{n.title}</p>
                            <p className="text-[9px] text-red-500 font-bold leading-tight">{n.message}</p>
                          </div>
                          <span className="text-[8px] font-black bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-950/50 whitespace-nowrap align-self-start mt-0.5">
                            Overdue
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Bottom bullet points */}
                <div className="space-y-1.5 pt-3 border-t border-orange-100/50 dark:border-orange-950/20">
                  {[
                    'View all overdue tasks',
                    'Know how many days a task is overdue',
                    'Prioritize and take action',
                    'Keep your projects on track'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-orange-800/80 dark:text-orange-300/80 font-bold">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Project Status (Members) */}
              <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">Project Status</h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Members Activity</p>
                    </div>
                  </div>

                  {/* Members Activity feed */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    {dynamicMembers.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-center">No member activity logged yet.</p>
                    ) : (
                      dynamicMembers.map((n) => {
                        const user = findUserByMessage(n.message);
                        const initials = user ? user.name.split(' ').map((x: any) => x[0]).join('').toUpperCase() : '??';
                        return (
                          <div key={n._id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 dark:border-gray-700/50">
                            {renderUserAvatar(user, initials)}
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold leading-tight">
                                {n.message}
                              </p>
                              <p className="text-[8px] text-gray-400">{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bottom bullet points */}
                <div className="space-y-1.5 pt-3 border-t border-emerald-100/50 dark:border-emerald-950/20">
                  {[
                    'Track new members added',
                    'Track members removed',
                    'Stay updated with team changes',
                    'Better team visibility'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-emerald-800/80 dark:text-emerald-300/80 font-bold">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Project Status Updates (Workflow) */}
              <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-950/30 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-purple-950 dark:text-purple-200">Project Status</h4>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Task & Phase Updates</p>
                    </div>
                  </div>

                  {/* Workflow updates list */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {dynamicWorkflow.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-center">No status updates logged yet.</p>
                    ) : (
                      dynamicWorkflow.map((n) => {
                        const user = findUserByMessage(n.message);
                        const initials = user ? user.name.split(' ').map((x: any) => x[0]).join('').toUpperCase() : '??';
                        
                        const transitionMatch = n.message.match(/from\s+([^\s"]+|"[^"]+")\s+to\s+([^\s"]+|"[^"]+")/i);
                        const transition = transitionMatch ? `${transitionMatch[1].replace(/"/g, '')} → ${transitionMatch[2].replace(/"/g, '')}` : null;
                        
                        const taskNameMatch = n.message.match(/moved\s+"([^"]+)"/i) || n.message.match(/assigned\s+you\s+a\s+new\s+task:\s*(.+)/i);
                        const taskName = taskNameMatch ? taskNameMatch[1] : n.title;

                        return (
                          <div key={n._id} className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-1">
                            <div className="flex items-center gap-1.5">
                              {renderUserAvatar(user, initials)}
                              <div className="flex flex-col min-w-0">
                                <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 leading-none truncate">{getUserDisplayName(n)}</p>
                                <p className="text-[8px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider mt-0.5">{n.title}</p>
                              </div>
                            </div>
                            <p className="text-[11px] font-black text-gray-850 dark:text-gray-250 leading-tight">{taskName}</p>
                            {transition && (
                              <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800/80 inline-block capitalize">
                                {transition}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                              {n.message}
                            </p>
                            <p className="text-[8px] text-gray-400">{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bottom bullet points */}
                <div className="space-y-1.5 pt-3 border-t border-purple-100/50 dark:border-purple-950/20">
                  {[
                    'Track task completion',
                    'Track status changes',
                    'Track phase transitions',
                    'Get real-time project updates'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-purple-800/80 dark:text-purple-300/80 font-bold">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">


            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 mb-4 flex items-center justify-center">
                  <img src="/search-logo.png" className="w-full h-full object-contain" alt="No notifications" />
                </div>
                <p className="text-gray-800 dark:text-gray-300 font-bold">All caught up!</p>
                <p className="text-sm text-gray-500 mt-1">No notifications found in this category.</p>
              </div> 
            ) : (
              Object.entries(groupedNotifications).map(([groupName, items]) => {
                if (items.length === 0) return null;
                const isExpanded = expandedGroups[groupName];

                return (
                  <div key={groupName} className="mb-2">
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
                        {groupName}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        Show {isExpanded ? 'less' : 'all'} ({items.length})
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-2 space-y-2">
                        {items.map((n) => {
                          const category = getNotificationCategory(n);
                          const styles = getCategoryStyles(category);
                          const Icon = styles.icon;

                          return (
                            <div
                              key={n._id}
                              className={`relative group rounded-xl p-3 flex gap-3 transition-all duration-200 border ${
                                !n.read
                                  ? 'bg-[#ee2a7b]/[0.02] dark:bg-[#ee2a7b]/10 border-[#ee2a7b]/20 hover:bg-[#ee2a7b]/[0.04] dark:hover:bg-[#ee2a7b]/20'
                                  : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/20'
                              }`}
                            >
                              {/* Unread Indicator dot */}
                              {!n.read && (
                                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-[0_0_8px_rgba(238,42,123,0.5)]" />
                              )}

                              {/* Icon */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles.bg} ${styles.color}`}>
                                <Icon size={18} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 py-0.5">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <p className={`text-sm leading-tight truncate font-bold ${!n.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {category}
                                    </p>
                                    {n.data?.taskId && (
                                      <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700/50 shrink-0">
                                        #{n.data.taskId.slice(-6)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 mt-0.5">
                                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className={`text-xs mt-1 font-medium ${!n.read ? 'text-gray-800 dark:text-gray-300' : 'text-gray-500'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                  {n.message}
                                </p>

                                {/* Hover Actions */}
                                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationRead(n._id);
                                      onNotificationClick(n);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                      !n.read
                                        ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-[var(--theme-accent-muted)] hover:bg-[var(--theme-accent-glow)]'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {category.includes('Task') ? 'View Task' : 'View'}
                                  </button>
                                  {!n.read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationRead(n._id);
                                      }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700/50 transition-all"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Context Menu Dot */}
                              <button className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
                                <MoreHorizontal size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center">
          <button
            onClick={() => onSettingsClick()}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings size={14} />
            Notification settings
          </button>
          <button className="flex items-center gap-1 text-xs font-bold text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors px-2 py-1.5 rounded-lg hover:bg-[var(--theme-accent-muted)]">
            View all notifications
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
};
