import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { api } from '../utils/api';

// Mock localstorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock api utility
vi.mock('../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

let useStore: any;

beforeAll(async () => {
  const mod = await import('./useStore');
  useStore = mod.useStore;
});

describe('useStore Zustand Store', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset Zustand store state manually where needed
    useStore.setState({
      currentUser: null,
      activeView: 'dashboard',
      searchQuery: '',
      filterStatus: 'all',
      filterAssignee: 'all',
      theme: 'light',
      selectedTaskId: null,
      projects: [],
      users: []
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct default state values', () => {
      const state = useStore.getState();
      expect(state.currentUser).toBeNull();
      expect(state.activeView).toBe('dashboard');
      expect(state.searchQuery).toBe('');
      expect(state.filterStatus).toBe('all');
      expect(state.theme).toBe('light');
    });
  });

  describe('Synchronous UI Actions', () => {
    it('should update active view', () => {
      useStore.getState().setActiveView('analytics');
      expect(useStore.getState().activeView).toBe('analytics');
    });

    it('should toggle theme and update localStorage', () => {
      expect(useStore.getState().theme).toBe('light');
      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');

      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should update search query and filters', () => {
      useStore.getState().setSearchQuery('fix authentication');
      expect(useStore.getState().searchQuery).toBe('fix authentication');

      useStore.getState().setFilterStatus('in-progress');
      expect(useStore.getState().filterStatus).toBe('in-progress');
    });

    it('should update selected task ID', () => {
      useStore.getState().setSelectedTaskId('task-999');
      expect(useStore.getState().selectedTaskId).toBe('task-999');
    });

    it('should set currentUser during login and clear it during logout', () => {
      const mockUsers = [
        { id: 'u1', name: 'Alice', email: 'alice@k.io', avatar: 'A', role: 'admin' as const, color: 'blue', joinedAt: '' }
      ];
      useStore.setState({ users: mockUsers });

      useStore.getState().login('u1');
      expect(useStore.getState().currentUser).toEqual(mockUsers[0]);

      useStore.getState().logout();
      expect(useStore.getState().currentUser).toBeNull();
    });
  });

  describe('Asynchronous Store Actions', () => {
    it('should fetch projects and map them correctly', async () => {
      const mockApiProjects = [
        { _id: 'proj1', name: 'Project 1', description: 'desc', status: 'active', members: [{ userId: 'user1' }] }
      ];
      vi.mocked(api.get).mockResolvedValue(mockApiProjects);

      const projects = await useStore.getState().fetchProjects();

      expect(api.get).toHaveBeenCalledWith('/projects');
      expect(projects).toEqual([
        {
          id: 'proj1',
          _id: 'proj1',
          name: 'Project 1',
          description: 'desc',
          status: 'active',
          members: ['user1']
        }
      ]);
      expect(useStore.getState().projects).toEqual(projects);
    });

    it('should fetch users and map them correctly', async () => {
      const mockApiUsers = [
        { _id: 'u1', name: 'John Doe', globalRole: 'admin', email: 'john@k.io', avatar: 'JD' }
      ];
      vi.mocked(api.get).mockResolvedValue(mockApiUsers);

      const users = await useStore.getState().fetchUsers();

      expect(api.get).toHaveBeenCalledWith('/users');
      expect(users[0]).toEqual(expect.objectContaining({
        id: 'u1',
        _id: 'u1',
        name: 'John Doe',
        role: 'admin',
        email: 'john@k.io',
        avatar: 'JD'
      }));
      expect(useStore.getState().users).toEqual(users);
    });
  });
});
