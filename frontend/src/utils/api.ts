import axios, { AxiosInstance } from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get cookie value by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token and CSRF token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Inject CSRF token on mutating requests
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    const csrfToken = getCookie('csrfToken');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

// Handle token expiry
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    const res = await axiosInstance.get(endpoint);
    return res.data;
  },

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    const res = await axiosInstance.post(endpoint, data);
    return res.data;
  },

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    const res = await axiosInstance.put(endpoint, data);
    return res.data;
  },

  async patch<T = any>(endpoint: string, data: any): Promise<T> {
    const res = await axiosInstance.patch(endpoint, data);
    return res.data;
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const res = await axiosInstance.delete(endpoint);
    return res.data;
  }
};

// Authentication API
export const authApi = {
  async signup(name: string, email: string, password: string, confirmPassword: string) {
    return api.post('/auth/signup', { name, email, password, confirmPassword, globalRole: 'user' });
  },

  async login(email: string, password: string) {
    return api.post('/auth/login', { email, password });
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return api.post('/auth/logout', {});
  },

  async getCurrentUser() {
    return api.get('/auth/me');
  },

  async updateProfile(name: string, bio: string, avatar: string, globalRole?: string) {
    return api.put('/auth/profile', { name, bio, avatar, globalRole });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return api.put('/auth/change-password', { currentPassword, newPassword });
  }
};

// Projects API
export const projectsApi = {
  async getAll() {
    return api.get('/projects');
  },

  async getById(projectId: string) {
    return api.get(`/projects/${projectId}`);
  },

  async create(name: string, description: string) {
    return api.post('/projects', { name, description });
  },

  async update(projectId: string, data: any) {
    return api.put(`/projects/${projectId}`, data);
  },

  async delete(projectId: string) {
    return api.delete(`/projects/${projectId}`);
  },

  async addMember(projectId: string, userId: string, role: string) {
    return api.post(`/projects/${projectId}/members`, { userId, role });
  },

  async updateMember(projectId: string, memberId: string, role: string) {
    return api.put(`/projects/${projectId}/members/${memberId}`, { role });
  },

  async removeMember(projectId: string, memberId: string) {
    return api.delete(`/projects/${projectId}/members/${memberId}`);
  }
};

// Tasks API
export const tasksApi = {
  async getByProject(projectId: string, filters?: any) {
    let endpoint = `/tasks/${projectId}`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (params.toString()) endpoint += `?${params.toString()}`;
    }
    return api.get(endpoint);
  },

  async getById(projectId: string, taskId: string) {
    return api.get(`/tasks/${projectId}/${taskId}`);
  },

  async create(projectId: string, data: any) {
    return api.post(`/tasks/${projectId}`, data);
  },

  async update(projectId: string, taskId: string, data: any) {
    return api.put(`/tasks/${projectId}/${taskId}`, data);
  },

  async delete(projectId: string, taskId: string) {
    return api.delete(`/tasks/${projectId}/${taskId}`);
  }
};
