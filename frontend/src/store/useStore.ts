import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';

export type TaskStatus = 'pending' | 'in-progress' | 'stuck' | 'completed';
export type UserRole = 'admin' | 'executive' | 'user' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  color: string;
  joinedAt: string;
  bio?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignees: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  estimatedHours: number;
  actualWorkedHours: number;
  tags: string[];
}

export interface TimeLog {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  workDate: string;
  description: string;
  isBillable: boolean;
  status: 'active' | 'paused' | 'completed';
}

export interface DailyLog {
  id: string;
  date: string;
  userId: string;
  content: string;
  completedTasks: string[];
  blockers: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  visibility: 'public' | 'restricted' | 'admin-only';
  priority: 'low' | 'medium' | 'high';
  isLocked: boolean;
  members: string[];
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface AppState {
  currentUser: User | null;
  project: Project;
  projects: Project[];
  users: User[];
  tasks: Task[];
  dailyLogs: DailyLog[];
  notifications: any[];
  taskComments: Record<string, TaskComment[]>; // taskId -> comments
  activeView: 'dashboard' | 'board' | 'analytics' | 'logs' | 'members' | 'profile' | 'tracker' | 'files' | 'dependency';
  searchQuery: string;
  filterStatus: TaskStatus | 'all';
  filterAssignee: string | 'all';
  isLoading: boolean;
  theme: 'light' | 'dark';
  showArchived: boolean;

  fetchData: () => Promise<void>;
  fetchProjects: () => Promise<Project[]>;
  fetchUsers: () => Promise<User[]>;
  fetchTasks: (projectId?: string) => Promise<void>;
  fetchLogs: (projectId?: string) => Promise<void>;
  setProject: (project: Project) => Promise<void>;
  toggleTheme: () => void;

  // Auth
  login: (userId: string) => void;
  logout: () => void;

  // Project
  updateProject: (data: Partial<Project>) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'members'>) => Promise<void>;
  addMemberToProject: (projectId: string, userId: string) => Promise<void>;

  // Users
  addUser: (user: Omit<User, 'id' | 'joinedAt'>, password?: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, status: TaskStatus) => Promise<void>;
  refreshTask: (taskId: string) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;

  // Task Comments
  fetchTaskComments: (taskId: string) => Promise<void>;
  addTaskComment: (taskId: string, content: string) => Promise<void>;

  // Daily Logs
  addLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLog: (id: string, data: Partial<DailyLog>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;

  // UI
  setActiveView: (view: AppState['activeView']) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: TaskStatus | 'all') => void;
  setFilterAssignee: (assignee: string | 'all') => void;
  setShowArchived: (show: boolean) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  tourStep: number;
  setTourStep: (step: number) => void;

  // Dependencies state
  dependencies: any[];
  criticalPath: string[];
  dependencyEvents: any[];
  aiInsights: any;

  fetchDependencies: () => Promise<void>;
  addDependency: (sourceTaskId: string, targetTaskId: string, dependencyType: string) => Promise<void>;
  deleteDependency: (dependencyId: string) => Promise<void>;
  bulkRemapDependencies: (taskId: string, dependencies: Array<{ targetTaskId: string, dependencyType: string }>) => Promise<void>;
  fetchCriticalPath: () => Promise<void>;
  fetchDependencyEvents: () => Promise<void>;
  fetchAIInsights: () => Promise<void>;
}

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  '#f97316', '#84cc16',
];

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  project: {
    id: 'project-1',
    name: 'Loading...',
    description: '',
    status: 'active',
    visibility: 'public',
    priority: 'medium',
    isLocked: false,
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  projects: [],
  users: [],
  tasks: [],
  dailyLogs: [],
  notifications: [],
  taskComments: {},
  activeView: 'dashboard',
  searchQuery: '',
  filterStatus: 'all',
  filterAssignee: 'all',
  isLoading: false,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  showArchived: false,
  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  isTourActive: false,
  setIsTourActive: (active) => set({ isTourActive: active }),
  tourStep: 0,
  setTourStep: (step) => set({ tourStep: step }),

  fetchProjects: async () => {
    try {
      const projects = await api.get(`/projects${get().showArchived ? '?includeArchived=true' : ''}`);
      const mappedProjects = projects.map((p: any) => ({
        ...p,
        id: p._id,
        members: (p.members || []).map((m: any) => m.userId?._id || m.userId || m),
      }));
      set({ projects: mappedProjects });
      return mappedProjects;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      return [];
    }
  },

  fetchUsers: async () => {
    try {
      const users = await api.get('/users');
      const mappedUsers = users.map((u: any) => ({
        ...u,
        id: u._id,
        role: u.globalRole,
        color: AVATAR_COLORS[users.indexOf(u) % AVATAR_COLORS.length],
      }));
      set({ users: mappedUsers });
      return mappedUsers;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  },

  fetchTasks: async (projectId?: string) => {
    const pId = projectId || get().project.id;
    if (pId === 'project-1') return;
    try {
      const sq = get().searchQuery;
      const taskUrl = `/tasks/${pId}${sq ? `?search=${encodeURIComponent(sq)}` : ''}`;
      const response = await api.get(taskUrl);
      const mappedTasks = (response?.tasks || []).map((t: any) => ({
        ...t,
        id: t._id || t.id,
        assignees: (t.assignees || []).map((a: any) => a._id || a)
      }));
      set({ tasks: mappedTasks });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  },

  fetchLogs: async (projectId?: string) => {
    const pId = projectId || get().project.id;
    if (pId === 'project-1') return;
    try {
      const response = await api.get(`/logs?projectId=${pId}`);
      const mappedLogs = (response?.logs || []).map((l: any) => ({
        ...l,
        id: l._id || l.id,
        userId: l.userId?._id || l.userId
      }));
      set({ dailyLogs: mappedLogs });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  },

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [mappedProjects, mappedUsers] = await Promise.all([
        get().fetchProjects(),
        get().fetchUsers(),
      ]);

      const currentProject = mappedProjects.find((p: Project) => p.id === get().project.id) || mappedProjects[0] || get().project;

      const storedUserStr = localStorage.getItem('user');
      let actualCurrentUser = null;
      if (storedUserStr && mappedUsers.length > 0) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          actualCurrentUser = mappedUsers.find((u: User) => u.id === (storedUser.id || storedUser._id));
        } catch (e) { }
      }

      set({
        project: currentProject,
        currentUser: actualCurrentUser || mappedUsers[0] || null,
      });

      if (currentProject.id && currentProject.id !== 'project-1') {
        await Promise.all([
          get().fetchTasks(currentProject.id),
          get().fetchLogs(currentProject.id)
        ]);
      }

      set({ isLoading: false });
      get().fetchNotifications();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      set({ isLoading: false });
    }
  },

  setProject: async (project) => {
    set({ project, isLoading: true });
    try {
      await Promise.all([
        get().fetchTasks(project.id),
        get().fetchLogs(project.id)
      ]);
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  login: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) set({ currentUser: user });
  },

  logout: () => set({ currentUser: null }),

  updateProject: async (data) => {
    const response = await api.put(`/projects/${get().project.id}`, data);
    const updated = {
      ...response,
      id: response._id || response.id,
      members: (response.members || []).map((m: any) => m.userId?._id || m.userId || m),
    };
    set((state) => ({
      project: updated,
      projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
    }));
  },

  addProject: async (projectData) => {
    const newProject = {
      ...projectData,
      members: [],
    };
    const saved = await api.post('/projects', newProject);
    if (saved.error) {
      console.error('Failed to save project:', saved.error);
      return;
    }
    const mapped = {
      ...saved,
      id: saved._id || saved.id,
      members: (saved.members || []).map((m: any) => m.userId?._id || m.userId || m),
    };
    set((state) => ({
      projects: [...state.projects, mapped]
    }));
    await get().setProject(mapped);
  },

  addMemberToProject: async (projectId, userId) => {
    const response = await api.post(`/projects/${projectId}/members`, { userId, role: 'TeamMember' });
    const updated = {
      ...response,
      id: response._id || response.id,
      members: (response.members || []).map((m: any) => m.userId?._id || m.userId || m),
    };
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
      project: state.project.id === projectId ? updated : state.project,
    }));
  },

  addUser: async (userData, password) => {
    // Register via auth signup then add to project
    const pw = password || 'Temp@1234'; // caller should pass a real password
    const response = await api.post('/auth/signup', {
      name: userData.name,
      email: userData.email,
      password: pw,
      confirmPassword: pw,
      globalRole: userData.role === 'admin' ? 'admin' : 'user',
    });
    const saved = { ...response.user, id: response.user.id || response.user._id, role: userData.role, color: AVATAR_COLORS[get().users.length % AVATAR_COLORS.length] };
    await get().addMemberToProject(get().project.id, saved.id);
    set((state) => ({ users: [...state.users, saved] }));
  },

  updateUser: async (id, data) => {
    const updated = await api.put(`/users/${id}`, data);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? updated : u)),
      currentUser: state.currentUser?.id === id ? updated : state.currentUser,
    }));
  },

  removeUser: async (id) => {
    try { await api.delete(`/users/${id}`); } catch { /* ignore */ }
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      project: {
        ...state.project,
        members: state.project.members.filter(m => m !== id)
      },
      projects: state.projects.map(p => ({
        ...p,
        members: p.members.filter(m => m !== id)
      })),
      tasks: state.tasks.map((t) => ({
        ...t,
        assignees: t.assignees.filter((a) => a !== id),
      })),
    }));
  },

  addTask: async (taskData) => {
    const projectId = get().project.id;
    const saved = await api.post(`/tasks/${projectId}`, {
      title: taskData.title,
      description: taskData.description,
      assignees: taskData.assignees,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      status: taskData.status || 'pending',
    });
    const mapped = { ...saved, id: saved._id || saved.id, assignees: (saved.assignees || []).map((a: any) => a._id || a) };
    set((state) => ({ tasks: [mapped, ...state.tasks] }));
  },

  updateTask: async (id, data) => {
    const projectId = get().project.id;
    const updated = await api.put(`/tasks/${projectId}/${id}`, data);
    const mapped = { ...updated, id: updated._id || updated.id, assignees: (updated.assignees || []).map((a: any) => a._id || a) };
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? mapped : t)),
    }));
  },

  deleteTask: async (id) => {
    const projectId = get().project.id;
    await api.delete(`/tasks/${projectId}/${id}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  moveTask: async (taskId, status) => {
    const projectId = get().project.id;
    const updated = await api.put(`/tasks/${projectId}/${taskId}`, { status });
    const mapped = { ...updated, id: updated._id || updated.id, assignees: (updated.assignees || []).map((a: any) => a._id || a) };
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? mapped : t)),
    }));
  },

  refreshTask: async (taskId) => {
    const projectId = get().project.id;
    const task = await api.get(`/tasks/${projectId}/${taskId}`);
    const mapped = { ...task, id: task._id || task.id, assignees: (task.assignees || []).map((a: any) => a._id || a) };
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? mapped : t)),
    }));
  },

  searchTasks: async (query) => {
    set({ searchQuery: query, isLoading: true });
    try {
      const projectId = get().project.id;
      const url = query ? `/tasks/${projectId}?search=${encodeURIComponent(query)}` : `/tasks/${projectId}`;
      const tasks = await api.get(url);
      set({
        tasks: (tasks?.tasks || []).map((t: any) => ({ ...t, id: t._id || t.id, assignees: (t.assignees || []).map((a: any) => a._id || a) })),
        isLoading: false
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchTaskComments: async (taskId) => {
    const comments = await api.get(`/tasks/${taskId}/comments`);
    const mapped = comments.map((c: any) => ({ ...c, id: c._id, userId: c.userId?._id || c.userId }));
    set((state) => ({
      taskComments: { ...state.taskComments, [taskId]: mapped }
    }));
  },

  addTaskComment: async (taskId, content) => {
    const saved = await api.post(`/tasks/${taskId}/comments`, { content });
    const mapped = { ...saved, id: saved._id, userId: saved.userId?._id || saved.userId };
    set((state) => ({
      taskComments: {
        ...state.taskComments,
        [taskId]: [...(state.taskComments[taskId] || []), mapped]
      }
    }));
  },

  addLog: async (logData) => {
    const newLog = {
      ...logData,
      id: uuidv4(),
      projectId: get().project.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = await api.post('/logs', newLog);
    const mapped = { ...saved, id: saved._id || saved.id, userId: saved.userId?._id || saved.userId };
    set((state) => ({ dailyLogs: [mapped, ...state.dailyLogs] }));
  },

  updateLog: async (id, data) => {
    const updated = await api.put(`/logs/${id}`, data);
    const mapped = { ...updated, id: updated._id || updated.id, userId: updated.userId?._id || updated.userId };
    set((state) => ({
      dailyLogs: state.dailyLogs.map((l) => (l.id === id ? mapped : l)),
    }));
  },

  deleteLog: async (id) => {
    await api.delete(`/logs/${id}`);
    set((state) => ({ dailyLogs: state.dailyLogs.filter((l) => l.id !== id) }));
  },

  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    set({ theme: newTheme });
  },
  setShowArchived: async (show) => {
    set({ showArchived: show });
    await get().fetchData();
  },
  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      set({ notifications: response });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },
  markNotificationRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      set((state) => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, read: true } : n)
      }));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  },
  markAllNotificationsRead: async () => {
    try {
      await api.put('/notifications/mark-all-read', {});
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  },

  // Dependencies Initial State
  dependencies: [],
  criticalPath: [],
  dependencyEvents: [],
  aiInsights: { bottlenecks: [], delays: [], suggestions: [] },

  fetchDependencies: async () => {
    const projectId = get().project.id;
    if (projectId === 'project-1') return;
    try {
      const response = await api.get(`/dependencies/${projectId}`);
      set({
        dependencies: response.dependencies || [],
      });
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    }
  },

  addDependency: async (sourceTaskId, targetTaskId, dependencyType) => {
    const projectId = get().project.id;
    try {
      const saved = await api.post(`/dependencies/${projectId}`, {
        sourceTaskId,
        targetTaskId,
        dependencyType
      });
      set((state) => ({
        dependencies: [...state.dependencies, saved]
      }));
      await get().fetchCriticalPath();
      await get().fetchAIInsights();
      await get().fetchDependencyEvents();
    } catch (error: any) {
      console.error('Failed to add dependency:', error);
      throw new Error(error.response?.data?.message || 'Failed to add dependency');
    }
  },

  deleteDependency: async (dependencyId) => {
    const projectId = get().project.id;
    try {
      await api.delete(`/dependencies/${projectId}/${dependencyId}`);
      set((state) => ({
        dependencies: state.dependencies.filter(d => d._id !== dependencyId)
      }));
      await get().fetchCriticalPath();
      await get().fetchAIInsights();
      await get().fetchDependencyEvents();
    } catch (error) {
      console.error('Failed to delete dependency:', error);
    }
  },

  bulkRemapDependencies: async (taskId, dependenciesList) => {
    const projectId = get().project.id;
    try {
      await api.post(`/dependencies/${projectId}/bulk-remap`, {
        taskId,
        dependencies: dependenciesList
      });
      await get().fetchDependencies();
      await get().fetchCriticalPath();
      await get().fetchAIInsights();
      await get().fetchDependencyEvents();
    } catch (error: any) {
      console.error('Failed to bulk remap dependencies:', error);
      throw new Error(error.response?.data?.message || 'Failed to remap dependencies');
    }
  },

  fetchCriticalPath: async () => {
    const projectId = get().project.id;
    if (projectId === 'project-1') return;
    try {
      const response = await api.get(`/dependencies/${projectId}/critical-path`);
      set({ criticalPath: response.criticalPath || [] });
    } catch (error) {
      console.error('Failed to fetch critical path:', error);
    }
  },

  fetchDependencyEvents: async () => {
    const projectId = get().project.id;
    if (projectId === 'project-1') return;
    try {
      const response = await api.get(`/dependencies/${projectId}/events`);
      set({ dependencyEvents: response || [] });
    } catch (error) {
      console.error('Failed to fetch dependency events:', error);
    }
  },

  fetchAIInsights: async () => {
    const projectId = get().project.id;
    if (projectId === 'project-1') return;
    try {
      const response = await api.get(`/dependencies/${projectId}/ai-insights`);
      set({ aiInsights: response || { bottlenecks: [], delays: [], suggestions: [] } });
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    }
  },
}));
