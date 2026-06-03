import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, Bell, Menu, X, Sun, Moon, LogOut, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Project overview and activity' },
  board: { title: 'Kanban Board', subtitle: 'Drag and drop tasks across columns' },
  logs: { title: 'Daily Status Log', subtitle: 'Team progress updates and blockers' },
  members: { title: 'Team Members', subtitle: 'Manage your team up to 10 members' },
  profile: { title: 'My Profile', subtitle: 'Manage your personal account settings' },
  dependency: { title: 'Dependency Map', subtitle: 'Visualize and manage task relationships' },
  analytics: { title: 'Analytics', subtitle: 'Productivity stats and work trends' },
  tracker: { title: 'Time Tracker', subtitle: 'Track and log work sessions for tasks' },
  files: { title: 'Files & Docs', subtitle: 'Upload and manage project documents' },
};

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const {
    activeView,
    theme,
    toggleTheme,
    setActiveView,
    projects,
    setProject,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedTaskId,
    setIsTourActive,
    setTourStep,
  } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // const stuckCount = tasks.filter((t) => t.status === 'stuck').length;
  const viewInfo = viewTitles[activeView] || viewTitles.dashboard;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500';
      case 'executive':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-500';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500';
    }
  };

  return (
    <header className="sticky top-0 h-16 glass-navbar flex items-center px-6 gap-4 shrink-0 z-20 transition-all duration-300">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <svg
          width="28"
          height="28"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g style={{ transform: 'translate(10px, 10px) scale(0.8)' }}>
            <g transform="translate(20, 10)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#FBBF24" />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#F59E0B" />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#F97316" />
            </g>
            <g transform="translate(20, 35)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#F59E0B" />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#EA580C" />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#D97706" />
            </g>
            <g transform="translate(20, 60)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#EA580C" />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#991B1B" />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#B91C1C" />
            </g>
            <g transform="translate(50, 10)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#FCD34D" />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#F59E0B" />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#FBBF24" />
            </g>
            <g transform="translate(45, 45)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#F97316" />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#C2410C" />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#EA580C" />
            </g>
            <g transform="translate(60, 60)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#EA580C" />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#7F1D1D" />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#991B1B" />
            </g>
          </g>
        </svg>
        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm tracking-tight">KairiX</span>
      </div>

      {/* Page Title */}
      <div className="hidden lg:block flex-1">
        <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{viewInfo.title}</h2>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{viewInfo.subtitle}</p>
      </div>

      {/* Multiplayer Presence indicators */}
      <div className="hidden md:flex items-center gap-3 bg-white/40 dark:bg-[#090d16]/30 border border-gray-100 dark:border-gray-800/80 px-3 py-1.5 rounded-xl backdrop-blur-md">
        <div className="flex -space-x-2">
          {/* Admin Avatar */}
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-gray-900 shadow-sm relative" title="Admin (Active)">
            <span>AD</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-gray-900 animate-pulse" />
          </div>
          {/* Jane Smith Avatar */}
          <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-gray-900 shadow-sm relative" title="Jane Smith (Active)">
            <span>JS</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-gray-900 animate-pulse" />
          </div>
          {/* John Doe Avatar */}
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-gray-900 shadow-sm relative" title="John Doe (Active)">
            <span>JD</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-gray-900 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping animate-pulse-glow" />
          <span className="text-[11px] font-bold tracking-tight text-gray-500 dark:text-gray-400 select-none">3 Active</span>
        </div>
      </div>

      {/* Onboarding Tour Trigger */}
      <button
        onClick={() => {
          setIsTourActive(true);
          setTourStep(0);
        }}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer"
      >
        <Sparkles size={13} className="animate-pulse" />
        <span>Interactive Tour</span>
      </button>

      <div className="flex-1 lg:flex-none" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`p-2 rounded-xl transition-all duration-300 relative ${showNotifications ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
        >
          <Bell size={20} className={unreadCount > 0 ? 'animate-bounce-subtle' : ''} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 dark:bg-indigo-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-gray-800">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-full mt-3 w-80 glass-panel rounded-2xl shadow-2xl z-30 overflow-hidden animate-dropdown">
              <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">All caught up!</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No new notifications to show.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={async () => {
                        markNotificationRead(n._id);
                        setShowNotifications(false);
                        if (n.data) {
                          if (n.data.projectId) {
                            const targetProj = projects.find(p => p.id === n.data.projectId);
                            if (targetProj) {
                              await setProject(targetProj);
                            }
                          }
                          if (n.data.taskId) {
                            setSelectedTaskId(n.data.taskId);
                          }
                        }
                        setActiveView('board');
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-indigo-600 dark:bg-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-none' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
                            {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-50 dark:border-gray-700 text-center">
                  <button
                    onClick={() => { markAllNotificationsRead(); }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Mark All as Read
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* User Menu */}
      {user && (
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(user.avatar || user.name.charAt(0)).substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                {user.name.split(' ')[0]}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user.globalRole}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 glass-panel rounded-2xl shadow-2xl z-30 w-64 overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                      {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(user.avatar || user.name.charAt(0)).substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${getRoleColor(user.globalRole)}`}>
                      {user.globalRole}
                    </span>
                    {user.globalRole === 'admin' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold tracking-widest shadow-[0_0_8px_rgba(99,102,241,0.3)] uppercase">
                        PRO TEAM
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => { setActiveView('profile'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User size={16} />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
