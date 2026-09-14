import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, UserRole } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pharmamatch_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res: any = await apiClient.get('/auth/me');
        if (res.success && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('pharmamatch_token');
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('pharmamatch_token');
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, role: UserRole = 'user') => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.post('/auth/login', { email, password: 'Password@123' });
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('pharmamatch_token', res.data.token);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: IUser = {
      ...user,
      role: newRole,
    };
    setUser(updated);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pharmamatch_token');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
