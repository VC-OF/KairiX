import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TaskDetail } from './components/tasks/TaskDetail';
import { TourGuide } from './components/ui/TourGuide';
import { KairixStudio } from './components/studio/KairixStudio';
import { ToastProvider, useToast } from './components/ui/Toast';
import { CommandPalette } from './components/ui/CommandPalette';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import {
  DashboardSkeleton,
  KanbanSkeleton,
  MembersSkeleton,
  AnalyticsSkeleton,
  ListSkeleton,
} from './components/ui/Skeleton';

const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const KanbanBoard = React.lazy(() => import('./components/board/KanbanBoard').then(m => ({ default: m.KanbanBoard })));
const DailyLogs = React.lazy(() => import('./components/logs/DailyLogs').then(m => ({ default: m.DailyLogs })));
const Members = React.lazy(() => import('./components/members/Members').then(m => ({ default: m.Members })));
const Profile = React.lazy(() => import('./components/profile/Profile').then(m => ({ default: m.Profile })));
const AnalyticsDashboard = React.lazy(() => import('./components/dashboard/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const GlobalTimeTracker = React.lazy(() => import('./components/tracker/GlobalTimeTracker').then(m => ({ default: m.GlobalTimeTracker })));
const FilesDocs = React.lazy(() => import('./components/files/FilesDocs').then(m => ({ default: m.FilesDocs })));
const DependencyWorkspace = React.lazy(() => import('./components/dependency/DependencyWorkspace').then(m => ({ default: m.DependencyWorkspace })));
const CalendarView = React.lazy(() => import('./components/calendar/CalendarView').then(m => ({ default: m.CalendarView })));

import { connectSocket, joinProjectRoom, disconnectSocket } from './utils/socket';

function AppLayout() {
  const {
    activeView,
    setActiveView,
    fetchData,
    theme,
    colorTheme,
    project,
    fetchNotifications,
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    isSidebarCollapsed,
    sidebarWidth,
    layoutDensity,
  } = useStore();
  const { token } = useAuth();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Trigger page transition loading indicator on route switch
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeView]);

  // Global automatic background syncing
  useEffect(() => {
    fetchData(); // Initial fetch

    // Background polling every 60 seconds to keep the app live without refreshing (fallback to websockets)
    const intervalId = setInterval(() => {
      fetchData(true); // true = silent fetch, no loading spinner
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Theme toggle
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Color theme
  useEffect(() => {
    if (colorTheme && colorTheme !== 'default') {
      document.documentElement.setAttribute('data-theme', colorTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [colorTheme]);

  // Sync active view with URL on first load
  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    const validViews = ['dashboard', 'board', 'logs', 'members', 'profile', 'analytics', 'tracker', 'files', 'dependency', 'calendar'];
    if (validViews.includes(path)) {
      setActiveView(path as any);
    }
  }, [setActiveView]);

  // Apply density data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-density', layoutDensity);
  }, [layoutDensity]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable;

      // Ctrl/Cmd + K → command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(p => !p);
        return;
      }

      if (isInput) return; // skip nav shortcuts when typing

      // ? → shortcuts
      if (e.key === '?') { setShowShortcuts(p => !p); return; }
      if (e.key === 'Escape') { setShowCommandPalette(false); setShowShortcuts(false); return; }

      // View shortcuts
      if (e.key === 'd') { setActiveView('dashboard'); }
      if (e.key === 'b') { setActiveView('board'); }
      if (e.key === 'm') { setActiveView('members'); }
      if (e.key === 'a') { setActiveView('analytics'); }
      if (e.key === 'l') { setActiveView('logs'); }
      if (e.key === 't') { setActiveView('tracker'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveView]);

  // Dynamic browser tab title per view
  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      board: 'Kanban Board',
      logs: 'Daily Logs',
      members: 'Team Members',
      profile: 'My Profile',
      analytics: 'Analytics',
      tracker: 'Time Tracker',
      files: 'Files & Docs',
      dependency: 'Dependency Map',
      calendar: 'Calendar View',
    };
    const viewTitle = titles[activeView] || 'Dashboard';
    document.title = `${viewTitle} ♾️ KairiX Beta`;
  }, [activeView]);

  // Socket.io: connect with auth + join project room
  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token, project.id !== 'project-1' ? project.id : undefined);

    // Real-time task events → refresh store
    socket.on('task-created', (task: any) => {
      useStore.getState().fetchData();
      const title = task?.title || 'A task';
      toast.success('Task Created', `"${title}" was added to the board`);
    });
    socket.on('task-updated', (task: any) => {
      const mapped = { ...task, id: task._id || task.id, assignees: (task.assignees || []).map((a: any) => a._id || a) };
      useStore.setState((state) => ({
        tasks: state.tasks.map((t) => (t.id === mapped.id ? mapped : t)),
      }));
      toast.info('Task Updated', `"${task.title}" was updated`);
    });
    socket.on('task-deleted', (taskId: string) => {
      useStore.setState((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }));
      toast.warning('Task Removed', 'A task was deleted from this board');
    });

    // Real-time task comments → append to store
    socket.on('comment-added', ({ taskId, comment }: { taskId: string; comment: any }) => {
      const mapped = { ...comment, id: comment._id };
      useStore.setState((state) => {
        const existingComments = state.taskComments[taskId] || [];
        if (existingComments.some(c => c.id === mapped.id)) return state;
        return {
          taskComments: {
            ...state.taskComments,
            [taskId]: [...existingComments, mapped]
          }
        };
      });
      toast.info('New Comment', 'A progress update was added to a task');
    });

    // Real-time project updates → update projects state list
    socket.on('project-updated', (updatedProj: any) => {
      const mapped = {
        ...updatedProj,
        id: updatedProj._id || updatedProj.id,
        members: (updatedProj.members || []).map((m: any) => m.userId?._id || m.userId || m)
      };
      useStore.setState((state) => ({
        projects: state.projects.map((p) => (p.id === mapped.id ? mapped : p)),
        project: state.project.id === mapped.id ? mapped : state.project
      }));
    });

    // Real-time project deleted → remove from projects list
    socket.on('project-deleted', (projectId: string) => {
      useStore.setState((state) => {
        const filteredProjects = state.projects.filter(p => p.id !== projectId);
        const nextActive = state.project.id === projectId ? (filteredProjects[0] || state.project) : state.project;
        return {
          projects: filteredProjects,
          project: nextActive
        };
      });
      if (useStore.getState().project.id === projectId) {
        useStore.getState().fetchData();
      }
    });

    // Real-time user project addition
    socket.on('project-added', (newProj: any) => {
      const mapped = {
        ...newProj,
        id: newProj._id || newProj.id,
        members: (newProj.members || []).map((m: any) => m.userId?._id || m.userId || m)
      };
      useStore.setState((state) => {
        if (state.projects.some(p => p.id === mapped.id)) return state;
        return {
          projects: [...state.projects, mapped]
        };
      });
    });

    // Real-time user project removal
    socket.on('project-removed', (projectId: string) => {
      useStore.setState((state) => {
        const filteredProjects = state.projects.filter(p => p.id !== projectId);
        const nextActive = state.project.id === projectId ? (filteredProjects[0] || state.project) : state.project;
        return {
          projects: filteredProjects,
          project: nextActive
        };
      });
      if (useStore.getState().project.id === projectId) {
        useStore.getState().fetchData();
      }
    });

    // Real-time notification → prepend to store
    socket.on('notification', (notification: any) => {
      useStore.setState((state) => ({
        notifications: [notification, ...state.notifications],
      }));
      toast.info(notification.title || 'New Notification', notification.message || '');
    });

    // Real-time daily logs
    socket.on('log-added', (newLog: any) => {
      useStore.setState((state) => {
        if (state.dailyLogs.some(l => l.id === newLog.id)) return state;
        return { dailyLogs: [newLog, ...state.dailyLogs] };
      });
    });

    socket.on('log-updated', ({ logId, content, completedTasks, blockers }: any) => {
      useStore.setState((state) => ({
        dailyLogs: state.dailyLogs.map(l => l.id === logId ? { ...l, content, completedTasks, blockers } : l)
      }));
    });

    socket.on('log-deleted', (logId: string) => {
      useStore.setState((state) => ({
        dailyLogs: state.dailyLogs.filter(l => l.id !== logId)
      }));
    });

    socket.on('log-voted', ({ logId, score, upvotedBy, downvotedBy }: any) => {
      useStore.setState((state) => {
        const myUserId = state.currentUser?.id;
        const userVote = myUserId && upvotedBy.includes(myUserId) ? 'up' : (myUserId && downvotedBy.includes(myUserId) ? 'down' : null);
        return {
          dailyLogs: state.dailyLogs.map(l => l.id === logId ? {
            ...l,
            thread: { ...(l.thread || { score: 1, userVote: null, comments: [] }), score, userVote }
          } : l)
        };
      });
    });

    socket.on('log-comment-added', ({ logId, comment, parentId }: any) => {
      useStore.setState((state) => {
        return {
          dailyLogs: state.dailyLogs.map(log => {
            if (log.id === logId) {
              const currentThread = log.thread || { score: 1, userVote: null, comments: [] };
              let updatedComments;
              if (!parentId) {
                if (currentThread.comments?.some((c: any) => c.id === comment.id)) return log;
                updatedComments = [...(currentThread.comments || []), comment];
              } else {
                const addReplyRecursive = (repliesList: any[]): any[] => {
                  return repliesList.map(item => {
                    if (item.id === parentId) {
                      if (item.replies?.some((r: any) => r.id === comment.id)) return item;
                      return { ...item, replies: [...(item.replies || []), comment] };
                    }
                    if (item.replies && item.replies.length > 0) {
                      return { ...item, replies: addReplyRecursive(item.replies) };
                    }
                    return item;
                  });
                };
                updatedComments = addReplyRecursive(currentThread.comments || []);
              }
              return { ...log, thread: { ...currentThread, comments: updatedComments } };
            }
            return log;
          })
        };
      });
    });

    socket.on('log-comment-voted', ({ logId, commentId, score, upvotedBy, downvotedBy }: any) => {
      useStore.setState((state) => {
        const myUserId = state.currentUser?.id;
        const userVote = myUserId && upvotedBy.includes(myUserId) ? 'up' : (myUserId && downvotedBy.includes(myUserId) ? 'down' : null);

        const updateVoteRecursive = (repliesList: any[]): any[] => {
          return repliesList.map(item => {
            if (item.id === commentId) {
              return { ...item, score, userVote };
            }
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: updateVoteRecursive(item.replies) };
            }
            return item;
          });
        };

        return {
          dailyLogs: state.dailyLogs.map(log => {
            if (log.id === logId) {
              const currentThread = log.thread || { score: 1, userVote: null, comments: [] };
              return { ...log, thread: { ...currentThread, comments: updateVoteRecursive(currentThread.comments || []) } };
            }
            return log;
          })
        };
      });
    });

    return () => {
      socket.off('task-created');
      socket.off('task-updated');
      socket.off('task-deleted');
      socket.off('comment-added');
      socket.off('project-updated');
      socket.off('project-deleted');
      socket.off('project-added');
      socket.off('project-removed');
      socket.off('notification');
      socket.off('log-added');
      socket.off('log-updated');
      socket.off('log-deleted');
      socket.off('log-voted');
      socket.off('log-comment-added');
      socket.off('log-comment-voted');
    };
  }, [token]);

  // Re-join project room when active project changes
  useEffect(() => {
    if (project.id && project.id !== 'project-1') {
      joinProjectRoom(project.id);
    }
  }, [project.id]);

  // Poll notifications every 60 seconds as a fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const renderView = () => {
    const skeletons: Record<string, React.ReactNode> = {
      dashboard: <DashboardSkeleton />,
      board: <KanbanSkeleton />,
      members: <MembersSkeleton />,
      analytics: <AnalyticsSkeleton />,
    };
    const fallback = skeletons[activeView] ?? <ListSkeleton rows={6} />;

    return (
      <React.Suspense fallback={
        <div className="flex-1 p-6 h-full w-full">{fallback}</div>
      }>
        {(() => {
          switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'board': return <KanbanBoard />;
            case 'logs': return <DailyLogs />;
            case 'members': return <Members />;
            case 'profile': return <Profile />;
            case 'analytics': return <AnalyticsDashboard />;
            case 'tracker': return <GlobalTimeTracker />;
            case 'files': return <FilesDocs />;
            case 'dependency': return <DependencyWorkspace />;
            case 'calendar': return <CalendarView />;
            default: return <Dashboard />;
          }
        })()}
      </React.Suspense>
    );
  };

  return (
    <div
      className="flex h-screen text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300"
      style={{ background: 'var(--theme-page-bg, var(--theme-sidebar-bg))' }}
    >
      {/* Vercel-style Glowing Top Progress Loader */}
      {isTransitioning && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 via-indigo-500 to-pink-500 z-50 animate-progress-bar" />
      )}

      {/* Sidebar - Desktop */}
      <div className={`hidden lg:flex transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'w-0' : ''
        }`} style={!isSidebarCollapsed ? { width: sidebarWidth } : undefined}>
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main
          className={`flex-1 ${activeView === 'board' || activeView === 'dependency' || activeView === 'calendar'
              ? 'flex flex-col overflow-hidden'
              : 'overflow-y-auto p-6'
            }`}
        >
          <div key={activeView} className={`animate-fade-in-slide h-full w-full ${activeView === 'board' || activeView === 'dependency' || activeView === 'calendar' ? 'flex flex-col overflow-hidden' : ''}`}>
            {renderView()}
          </div>
        </main>
      </div>

      {/* Onboarding guided tour */}
      <TourGuide />

      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {selectedTaskId && (() => {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return null;
        return (
          <TaskDetail
            isOpen={!!selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            task={task}
            onEdit={() => {
              setSelectedTaskId(null);
            }}
          />
        );
      })()}
    </div>
  );
}

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Disconnect socket on logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/board" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/tracker" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/dependency" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />

          {/* Public Landing & Redirects */}
          <Route path="/" element={<KairixStudio />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
