import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { api } from '../utils/api'

// ─────────────────────────────────────────────
// Mock localStorage
// ─────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// ─────────────────────────────────────────────
// Mock API utility
// ─────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// ─────────────────────────────────────────────
// Import store after mocks are set up
// ─────────────────────────────────────────────
let useStore: any

beforeAll(async () => {
  const mod = await import('./useStore')
  useStore = mod.useStore
})

// ─────────────────────────────────────────────
// REUSABLE MOCK DATA
// ─────────────────────────────────────────────

// What your API actually returns (MongoDB shape)
const mockApiProject = {
  _id: 'proj1',
  name: 'Project 1',
  description: 'desc',
  status: 'active',
  visibility: 'public',
  priority: 'medium',
  isLocked: false,
  members: [
    {
      userId: { _id: 'user1' },   // ✅ Populated object shape
      role: 'TeamMember'
    }
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

// What your store produces AFTER mapping
const mappedProject = {
  ...mockApiProject,
  id: 'proj1',                    // ✅ Added from _id
  members: ['user1'],             // ✅ Flattened to string array
  memberDetails: [
    {
      userId: 'user1',            // ✅ Extracted from userId._id
      role: 'TeamMember'          // ✅ Preserved from API
    }
  ]
}

// What your API returns for users
const mockApiUser = {
  _id: 'u1',
  name: 'John Doe',
  globalRole: 'admin',
  email: 'john@k.io',
  avatar: 'JD',
  joinedAt: '2024-01-01T00:00:00.000Z'
}

const mockUsers = [
  {
    id: 'u1',
    name: 'Alice',
    email: 'alice@k.io',
    avatar: 'A',
    role: 'admin' as const,
    color: 'blue',
    joinedAt: ''
  }
]

// ══════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════
describe('useStore Zustand Store', () => {

  beforeEach(() => {
    localStorage.clear()

    useStore.setState({
      currentUser: null,
      activeView: 'dashboard',
      searchQuery: '',
      filterStatus: 'all',
      filterAssignee: 'all',
      theme: 'light',
      selectedTaskId: null,
      projects: [],
      users: [],
      tasks: [],
      dailyLogs: [],
      isLoading: false,
      error: null
    })

    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────
  // SUITE 1: Initial State
  // ────────────────────────────────────────────
  describe('Initial State', () => {

    it('should have correct default state values', () => {
      const state = useStore.getState()
      expect(state.currentUser).toBeNull()
      expect(state.activeView).toBe('dashboard')
      expect(state.searchQuery).toBe('')
      expect(state.filterStatus).toBe('all')
      expect(state.theme).toBe('light')
      expect(state.projects).toEqual([])
      expect(state.users).toEqual([])
      expect(state.tasks).toEqual([])
    })

  })

  // ────────────────────────────────────────────
  // SUITE 2: Synchronous UI Actions
  // ────────────────────────────────────────────
  describe('Synchronous UI Actions', () => {

    it('should update active view', () => {
      useStore.getState().setActiveView('analytics')
      expect(useStore.getState().activeView).toBe('analytics')
    })

    it('should toggle theme and persist to localStorage', () => {
      // Starts light
      expect(useStore.getState().theme).toBe('light')

      // Toggle to dark
      useStore.getState().toggleTheme()
      expect(useStore.getState().theme).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')

      // Toggle back to light
      useStore.getState().toggleTheme()
      expect(useStore.getState().theme).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('should update search query', () => {
      useStore.getState().setSearchQuery('fix authentication')
      expect(useStore.getState().searchQuery).toBe('fix authentication')
    })

    it('should update filter status', () => {
      useStore.getState().setFilterStatus('in-progress')
      expect(useStore.getState().filterStatus).toBe('in-progress')
    })

    it('should update selected task ID and save to localStorage', () => {
      // ✅ Pre-load a task into store so setSelectedTaskId can find it
      useStore.setState({
        tasks: [{
          id: 'task-999',
          title: 'Test Task',
          status: 'pending',
          projectId: 'proj1'
        }],
        recentTasks: []
      })

      useStore.getState().setSelectedTaskId('task-999')
      expect(useStore.getState().selectedTaskId).toBe('task-999')
      expect(localStorage.getItem('lastOpenedTaskId')).toBe('task-999')
    })

    it('should clear selectedTaskId and localStorage on null', () => {
      useStore.getState().setSelectedTaskId(null)
      expect(useStore.getState().selectedTaskId).toBeNull()
      expect(localStorage.getItem('lastOpenedTaskId')).toBeNull()
    })

    it('should login user by id and logout correctly', () => {
      useStore.setState({ users: mockUsers })

      // Login
      useStore.getState().login('u1')
      expect(useStore.getState().currentUser).toEqual(mockUsers[0])

      // Logout
      useStore.getState().logout()
      expect(useStore.getState().currentUser).toBeNull()
    })

    it('should set filter assignee', () => {
      useStore.getState().setFilterAssignee('user-123')
      expect(useStore.getState().filterAssignee).toBe('user-123')
    })

  })

  // ────────────────────────────────────────────
  // SUITE 3: Async Actions - fetchProjects
  // ────────────────────────────────────────────
  describe('fetchProjects', () => {

    // ✅ TEST 1 - THE PREVIOUSLY FAILING TEST
    it('should fetch and correctly map projects from API', async () => {
      vi.mocked(api.get).mockResolvedValue([mockApiProject])

      const projects = await useStore.getState().fetchProjects()

      // ✅ Called correct endpoint
      expect(api.get).toHaveBeenCalledWith('/projects')

      // ✅ Returns correctly mapped projects
      expect(projects).toEqual([mappedProject])

      // ✅ Store is updated
      expect(useStore.getState().projects).toEqual([mappedProject])
    })

    // ✅ TEST 2
    it('should add id field equal to _id', async () => {
      vi.mocked(api.get).mockResolvedValue([mockApiProject])

      const projects = await useStore.getState().fetchProjects()

      expect(projects[0].id).toBe('proj1')
      expect(projects[0].id).toBe(projects[0]._id)
    })

    // ✅ TEST 3
    it('should flatten members array to string IDs', async () => {
      vi.mocked(api.get).mockResolvedValue([mockApiProject])

      const projects = await useStore.getState().fetchProjects()

      // members should be array of strings not objects
      expect(projects[0].members).toEqual(['user1'])
      expect(typeof projects[0].members[0]).toBe('string')
    })

    // ✅ TEST 4
    it('should build memberDetails with userId and role', async () => {
      vi.mocked(api.get).mockResolvedValue([mockApiProject])

      const projects = await useStore.getState().fetchProjects()

      expect(projects[0].memberDetails).toEqual([
        { userId: 'user1', role: 'TeamMember' }
      ])
    })

    // ✅ TEST 5
    it('should default role to TeamMember when role is missing', async () => {
      const projectNoRole = {
        ...mockApiProject,
        members: [
          { userId: { _id: 'user2' } }  // No role field
        ]
      }

      vi.mocked(api.get).mockResolvedValue([projectNoRole])

      const projects = await useStore.getState().fetchProjects()

      // ✅ role defaults to 'TeamMember'
      expect(projects[0].memberDetails[0].role).toBe('TeamMember')
    })

    // ✅ TEST 6
    it('should handle members with plain string userId', async () => {
      const projectStringMember = {
        ...mockApiProject,
        members: [
          { userId: 'user3', role: 'ProjectManager' }
        ]
      }

      vi.mocked(api.get).mockResolvedValue([projectStringMember])

      const projects = await useStore.getState().fetchProjects()

      expect(projects[0].members).toEqual(['user3'])
      expect(projects[0].memberDetails[0].userId).toBe('user3')
    })

    // ✅ TEST 7
    it('should return empty array and not throw on API failure', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network Error'))

      const projects = await useStore.getState().fetchProjects()

      expect(projects).toEqual([])
      // Store projects should remain empty
      expect(useStore.getState().projects).toEqual([])
    })

    // ✅ TEST 8
    it('should handle empty projects list', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const projects = await useStore.getState().fetchProjects()

      expect(projects).toEqual([])
      expect(useStore.getState().projects).toEqual([])
    })

    // ✅ TEST 9
    it('should append ?includeArchived=true when showArchived is true', async () => {
      useStore.setState({ showArchived: true })
      vi.mocked(api.get).mockResolvedValue([])

      await useStore.getState().fetchProjects()

      expect(api.get).toHaveBeenCalledWith('/projects?includeArchived=true')
    })

    // ✅ TEST 10
    it('should handle multiple projects correctly', async () => {
      const secondProject = {
        ...mockApiProject,
        _id: 'proj2',
        name: 'Project 2',
        members: []
      }

      vi.mocked(api.get).mockResolvedValue([
        mockApiProject,
        secondProject
      ])

      const projects = await useStore.getState().fetchProjects()

      expect(projects).toHaveLength(2)
      expect(projects[0].id).toBe('proj1')
      expect(projects[1].id).toBe('proj2')
      expect(useStore.getState().projects).toHaveLength(2)
    })

  })

  // ────────────────────────────────────────────
  // SUITE 4: Async Actions - fetchUsers
  // ────────────────────────────────────────────
  describe('fetchUsers', () => {

    // ✅ TEST 11
    it('should fetch users and map globalRole to role', async () => {
      vi.mocked(api.get).mockResolvedValue([mockApiUser])

      const users = await useStore.getState().fetchUsers()

      expect(api.get).toHaveBeenCalledWith('/users')

      expect(users[0]).toEqual(
        expect.objectContaining({
          id: 'u1',
          _id: 'u1',
          name: 'John Doe',
          role: 'admin',        // ✅ mapped from globalRole
          email: 'john@k.io',
          avatar: 'JD',
          color: '#6366f1'      // ✅ AVATAR_COLORS[0]
        })
      )
    })

    // ✅ TEST 12 (bonus)
    it('should return empty array on fetchUsers failure', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Server Error'))

      const users = await useStore.getState().fetchUsers()

      expect(users).toEqual([])
    })

  })

})
