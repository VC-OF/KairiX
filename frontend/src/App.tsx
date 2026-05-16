import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { KanbanBoard } from './components/board/KanbanBoard';
import { DailyLogs } from './components/logs/DailyLogs';
import { Members } from './components/members/Members';
import { Profile } from './components/profile/Profile';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { GlobalTimeTracker } from './components/tracker/GlobalTimeTracker';
import { FilesDocs } from './components/files/FilesDocs';
import { connectSocket, joinProjectRoom, disconnectSocket, getSocket } from './utils/socket';

function AppLayout() {
  const { activeView, setActiveView, fetchData, theme, project, notifications, fetchNotifications } = useStore();
  const { token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Sync active view with URL on first load
  useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    const validViews = ['dashboard', 'board', 'logs', 'members', 'profile', 'analytics', 'tracker', 'files'];
    if (validViews.includes(path)) {
      setActiveView(path as any);
    }
  }, [setActiveView]);

  // Socket.io: connect with auth + join project room
  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token, project.id !== 'project-1' ? project.id : undefined);

    // Real-time task events → refresh store
    socket.on('task-created', (task: any) => {
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
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'board': return <KanbanBoard />;
      case 'logs': return <DailyLogs />;
      case 'members': return <Members />;
      case 'profile': return <Profile />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'tracker': return <GlobalTimeTracker />;
      case 'files': return <FilesDocs />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
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
          className={`flex-1 overflow-y-auto p-6 ${activeView === 'board' ? 'flex flex-col' : ''
            }`}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const { isAuthenticated, token } = useAuth();

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

        {/* Redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
};

export default App;
