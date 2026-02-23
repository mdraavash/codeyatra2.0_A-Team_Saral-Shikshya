import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API } from '@/constants/api';

export interface User {
  id: string;
  name: string;
  email: string;
  roll: string;
  role: 'admin' | 'student' | 'teacher';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load stored auth on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // corrupted storage, ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const navigateByRole = (role: string) => {
    switch (role) {
      case 'admin':
        router.replace('/(admin)' as never);
        break;
      case 'teacher':
        router.replace('/(teacher)' as never);
        break;
      case 'student':
      default:
        router.replace('/(student)' as never);
        break;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(API.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Invalid credentials');
    }

    await AsyncStorage.setItem('token', data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    navigateByRole(data.user.role);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(API.ME, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        await AsyncStorage.setItem('user', JSON.stringify(data));
      }
    } catch {
      // silently fail
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
