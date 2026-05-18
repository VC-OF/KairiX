import { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  globalRole: 'admin' | 'executive' | 'user';
  avatar: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, bio: string, avatar: string, globalRole?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response: any = await authApi.login(email, password);
      const userData = response.user;
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(response.token);
      setUser(userData);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    try {
      const response: any = await authApi.signup(name, email, password, confirmPassword);
      const userData = response.user;
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(response.token);
      setUser(userData);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Clear local state first — always succeeds
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Best-effort server-side logout
    try { await authApi.logout(); } catch { /* ignore */ }
  };

  const updateProfile = async (name: string, bio: string, avatar: string, globalRole?: string) => {
    try {
      const response: any = await authApi.updateProfile(name, bio, avatar, globalRole);
      const updatedUser = { ...user, ...response };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
    } catch (err) {
      console.error('Failed to change password:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        signup,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


