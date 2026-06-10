import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, Bell, Menu, X, Sun, Moon, LogOut, User, Sparkles, Palette, Check, Star, PanelLeftOpen, Command, AlignJustify, AlignCenter, AlignLeft as AlignSpacious } from 'lucide-react';
import { NotificationsPanel } from './NotificationsPanel';

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
  calendar: { title: 'Calendar View', subtitle: 'Track worked hours, workload indicators and employee task timelines' },
};

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const {
    activeView,
    theme,
    colorTheme,
    defaultTheme,
    toggleTheme,
    setColorTheme,
    setDefaultTheme,
    setActiveView,
    projects,
    setProject,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedTaskId,
    setIsTourActive,
    setTourStep,
    users,
    currentUser,
    isSidebarCollapsed,
    toggleSidebar,
    layoutDensity,
    setLayoutDensity,
  } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showDensityMenu, setShowDensityMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // const stuckCount = tasks.filter((t) => t.status === 'stuck').length;
  const viewInfo = viewTitles[activeView] || viewTitles.dashboard;

  const THEMES = [
    { id: 'default' as const, label: 'Default', swatch: 'linear-gradient(135deg,#6366f1,#a855f7)' },
    { id: 'ocean'   as const, label: 'Ocean Blue',    swatch: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' },
    { id: 'forest'  as const, label: 'Forest Green',  swatch: 'linear-gradient(135deg,#22c55e,#10b981)' },
    { id: 'royal'   as const, label: 'Royal Purple',  swatch: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { id: 'sunset'  as const, label: 'Sunset Orange', swatch: 'linear-gradient(135deg,#fb923c,#f97316)' },
    { id: 'crimson' as const, label: 'Crimson Dark',  swatch: 'linear-gradient(135deg,#f87171,#dc2626)' },
  ];

  const isAdmin = currentUser?.role === 'admin' || user?.globalRole === 'admin';

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
      
      {/* Desktop expand sidebar button */}
      {isSidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/45 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer shadow-sm"
          title="Expand Sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

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

      {/* Command Palette trigger */}
      <button
        onClick={() => {
          const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
          window.dispatchEvent(event);
        }}
        title="Command Palette (Ctrl+K)"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all text-xs font-semibold"
      >
        <Command size={13} />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono text-gray-400">⌘K</kbd>
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
          <NotificationsPanel
            notifications={notifications}
            unreadCount={unreadCount}
            markNotificationRead={markNotificationRead}
            markAllNotificationsRead={markAllNotificationsRead}
            onClose={() => setShowNotifications(false)}
            onSettingsClick={() => {
              setShowNotifications(false);
              setActiveView('profile');
            }}
            onNotificationClick={async (n) => {
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
          />
        )}
      </div>

      {/* Day / Night / Themes / Density controls */}
      <div className="flex items-center gap-1 bg-gray-100/70 dark:bg-gray-800/70 rounded-xl p-1">
        {/* Day Mode */}
        <button
          id="btn-day-mode"
          onClick={() => { if (theme === 'dark') toggleTheme(); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            theme === 'light'
              ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          title="Switch to Day Mode"
        >
          <Sun size={14} />
          <span className="hidden sm:inline">Day</span>
        </button>

        {/* Night Mode */}
        <button
          id="btn-night-mode"
          onClick={() => { if (theme === 'light') toggleTheme(); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-gray-700 text-indigo-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          title="Switch to Night Mode"
        >
          <Moon size={14} />
          <span className="hidden sm:inline">Night</span>
        </button>

        {/* Density Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDensityMenu(d => !d)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              showDensityMenu ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Layout Density"
          >
            <AlignJustify size={14} />
            <span className="hidden sm:inline capitalize">{layoutDensity}</span>
          </button>
          {showDensityMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowDensityMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 glass-panel rounded-2xl shadow-2xl z-30 overflow-hidden animate-dropdown">
                <div className="p-2">
                  {(['dense', 'comfortable', 'spacious'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => { setLayoutDensity(d); setShowDensityMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                        layoutDensity === d ? 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {d === 'dense' && <AlignJustify size={14} />}
                      {d === 'comfortable' && <AlignCenter size={14} />}
                      {d === 'spacious' && <AlignSpacious size={14} />}
                      {d}
                      {layoutDensity === d && <Check size={12} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button
            id="btn-themes-menu"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              showThemeMenu
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {colorTheme !== 'default' ? (
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                style={{
                  background: (
                    { ocean: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
                      forest: 'linear-gradient(135deg,#22c55e,#10b981)',
                      royal: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                      sunset: 'linear-gradient(135deg,#fb923c,#f97316)',
                      crimson: 'linear-gradient(135deg,#f87171,#dc2626)' } as Record<string,string>
                  )[colorTheme] || 'linear-gradient(135deg,#6366f1,#a855f7)'
                }}
              />
            ) : (
              <Palette size={14} />
            )}
            <span className="hidden sm:inline">Themes</span>
            <ChevronDown size={11} className={`transition-transform duration-200 ${showThemeMenu ? 'rotate-180' : ''}`} />
          </button>

          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowThemeMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl shadow-2xl z-30 overflow-hidden animate-dropdown">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color Theme</p>
                </div>
                <div className="p-2">
                  {THEMES.map((t) => (
                    <div key={t.id} className="group flex items-center gap-2 px-2 py-1">
                      <button
                        id={`btn-theme-${t.id}`}
                        onClick={() => { setColorTheme(t.id); setShowThemeMenu(false); }}
                        className={`flex-1 flex items-center gap-2.5 px-2 py-2 rounded-xl text-left text-sm font-medium transition-all duration-150 ${
                          colorTheme === t.id
                            ? 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-sm"
                          style={{ background: t.swatch }}
                        />
                        <span className="flex-1">{t.label}</span>
                        {colorTheme === t.id && (
                          <Check size={13} className="text-gray-600 dark:text-gray-300 shrink-0" />
                        )}
                      </button>
                      {isAdmin && t.id !== 'default' && (
                        <button
                          id={`btn-set-default-theme-${t.id}`}
                          onClick={() => setDefaultTheme(t.id)}
                          title={defaultTheme === t.id ? 'Current default' : 'Set as team default'}
                          className={`shrink-0 p-1.5 rounded-lg transition-all ${
                            defaultTheme === t.id
                              ? 'text-amber-500'
                              : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star size={12} fill={defaultTheme === t.id ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                      <Star size={9} className="inline mr-1 text-amber-400" fill="currentColor" />
                      Star to set team default theme
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

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
