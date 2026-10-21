import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types.ts';
import { api, getStoredAuthToken, clearStoredAuthToken, setStoredAuthToken } from '../services/api.ts';
import { supabase, isSupabaseConfigured } from '../services/supabase.ts';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  signup: (data: {
    email: string;
    password?: string;
    name: string;
    major: string;
    semester: number;
    bio?: string;
    skills?: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  toasts: ToastItem[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch current user from active session token
  const refreshCurrentUser = useCallback(async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch (err) {
      console.warn('Session expired or invalid, clearing token.');
      clearStoredAuthToken();
      setCurrentUser(null);
    }
  }, []);

  // Login handler
  const login = useCallback(async (credentials: { email: string; password?: string }) => {
    // If Supabase is configured, sign in via Supabase Auth first
    if (isSupabaseConfigured && supabase && credentials.password) {
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });
        if (supaErr) throw supaErr;
        if (supaData.session?.access_token) {
          setStoredAuthToken(supaData.session.access_token);
        }
      } catch (err: any) {
        console.warn('Supabase Auth attempt:', err.message);
      }
    }

    const { user } = await api.login(credentials);
    setCurrentUser(user);
    addToast('Welcome back', `Signed in as ${user.name}`, 'success');
  }, [addToast]);

  // Signup handler
  const signup = useCallback(async (data: {
    email: string;
    password?: string;
    name: string;
    major: string;
    semester: number;
    bio?: string;
    skills?: string[];
  }) => {
    let supabaseId: string | undefined;

    // If Supabase is configured, sign up via Supabase Auth
    if (isSupabaseConfigured && supabase && data.password) {
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              major: data.major,
              semester: data.semester
            }
          }
        });
        if (supaErr) throw supaErr;
        supabaseId = supaData.user?.id;
        if (supaData.session?.access_token) {
          setStoredAuthToken(supaData.session.access_token);
        }
      } catch (err: any) {
        console.warn('Supabase Sign Up attempt:', err.message);
      }
    }

    const res = await api.signup({
      ...data,
      supabase_id: supabaseId
    });

    setCurrentUser(res.user);
    addToast('Account Created', `Welcome to CampusConnect, ${res.user.name}!`, 'success');
  }, [addToast]);

  // Logout handler
  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    await api.logout();
    setCurrentUser(null);
    addToast('Signed Out', 'You have been safely signed out.', 'info');
  }, [addToast]);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      setLoading(true);
      // If Supabase client configured, listen for session changes
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            setStoredAuthToken(data.session.access_token);
          }
        } catch (e) {
          console.warn('Supabase getSession:', e);
        }
      }

      await refreshCurrentUser();
      if (mounted) setLoading(false);
    };

    initAuth();
    return () => {
      mounted = false;
    };
  }, [refreshCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        loading,
        login,
        signup,
        logout,
        refreshCurrentUser,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Aliases for any remaining components
export const useDemoUser = useAuth;
export const DemoUserProvider = AuthProvider;
