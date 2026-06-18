import React, { useState, useMemo } from 'react';
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
  Info
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
      <div className="absolute right-0 top-full mt-3 w-[460px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 rounded-[20px] shadow-2xl z-30 overflow-hidden flex flex-col max-h-[85vh] animate-dropdown">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-[var(--theme-accent)]" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-bold border border-green-500/20">
                  {unreadCount} New
                </span>
              )}
            </div>
            <button
              onClick={() => markAllNotificationsRead()}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[var(--theme-accent)] transition-colors flex items-center gap-1"
            >
              <CheckCircle2 size={14} />
              Mark all as read
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {renderFilterChip('All')}
            {renderFilterChip('Unread', unreadCount)}
            {renderFilterChip('Tasks')}
            {renderFilterChip('Mentions')}
            {renderFilterChip('Comments')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700/50">
                <Bell size={24} className="text-gray-400 dark:text-gray-500" />
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
