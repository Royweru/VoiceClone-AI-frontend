'use client'
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants';



type AuthContextType = {
  user: User;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }:{
    children:React.ReactNode
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
          const res =await api.get('/api/auth/user/') 
          setUser(res.data);
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username:string, password:string) => {
    try {
      const { data } = await api.post('/api/auth/login/', { username, password });
      
      localStorage.setItem(ACCESS_TOKEN, data.access);
      localStorage.setItem(REFRESH_TOKEN, data.refresh);
      
      
      setUser(data.user);
      router.push('/');
    } catch (error:any) {
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const register = async (username:string, email:string, password:string, password2:string) => {
    try {
      const { data } = await api.post('/api/auth/register/', {
        username,
        email,
        password,
        password2
      });
      
      localStorage.setItem(ACCESS_TOKEN, data.access);
      localStorage.setItem(REFRESH_TOKEN, data.refresh);
   
      
      setUser(data.user);
      router.push('/');
    } catch (error:any) {
      const errorMessage = error.response?.data || 'Registration failed';
      throw typeof errorMessage === 'string' ? errorMessage : 
        Object.values(errorMessage).join('\n');
    }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
  
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register,logout} }>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};