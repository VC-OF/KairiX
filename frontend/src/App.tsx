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
  } = useStore();
  const { token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Trigger page transition loading indicator on route switch
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeView]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
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
    document.title = `${viewTitle} ♾️ KairiX`;
  }, [activeView]);

  // Socket.io: connect with auth + join project room
  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token, project.id !== 'project-1' ? project.id : undefined);

    // Real-time task events → refresh store
    socket.on('task-created', () => {
      useStore.getState().fetchData();
    });
    socket.on('task-updated', (task: any) => {
      const mapped = { ...task, id: task._id || task.id, assignees: (task.assignees || []).map((a: any) => a._id || a) };
      useStore.setState((state) => ({
        tasks: state.tasks.map((t) => (t.id === mapped.id ? mapped : t)),
      }));
    });
    socket.on('task-deleted', (taskId: string) => {
      useStore.setState((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }));
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
    return (
      <React.Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-12 bg-white/40 dark:bg-[#090d16]/30 border border-gray-150/45 dark:border-gray-800 rounded-3xl animate-pulse h-full w-full">
          <div className="flex flex-col items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loading workspace view...</p>
          </div>
        </div>
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
      <div className="hidden lg:flex">
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
          className={`flex-1 ${
            activeView === 'board' || activeView === 'dependency' || activeView === 'calendar'
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
  );
};

export default App;
