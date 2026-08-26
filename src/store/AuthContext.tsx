import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { db } from './db';
import { fetchSettings } from './settings';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Supabase on auth state change
  const loadProfile = useCallback(async (userId: string) => {
    const profile = await db.getUserById(userId);
    if (profile && profile.status === 'approved') {
      setUser(profile);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Fetch settings from Supabase on app start
    void fetchSettings();

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Supabase advises against awaiting another Supabase request directly
        // inside this callback because the auth client holds an internal lock.
        window.setTimeout(() => { void loadProfile(session.user.id); }, 0);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    const settings = await fetchSettings();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, message: error.message === 'Invalid login credentials'
        ? 'Invalid email or password.'
        : error.message };
    }
    if (!data.user) return { success: false, message: 'Login failed.' };

    // Fetch profile
    const profile = await db.getUserById(data.user.id);
    if (!profile) return { success: false, message: 'Profile not found.' };

    if (profile.status === 'pending') {
      await supabase.auth.signOut();
      return { success: false, message: 'Your account is pending admin approval.' };
    }
    if (profile.status === 'rejected') {
      await supabase.auth.signOut();
      return { success: false, message: 'Your account registration was rejected.' };
    }

    // During maintenance mode, only admins can login
    if (settings.maintenanceMode && profile.role !== 'admin') {
      await supabase.auth.signOut();
      return { success: false, message: 'The site is under maintenance. Only administrators can log in.' };
    }

    setUser(profile);
    return { success: true, message: 'Welcome back!' };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    const settings = await fetchSettings();

    if (!settings.allowRegistration) {
      return { success: false, message: 'New registrations are currently disabled.' };
    }

    // Check if username is taken
    try {
      const usernameAvailable = await db.isUsernameAvailable(username);
      if (!usernameAvailable) return { success: false, message: 'Username is already taken.' };
    } catch {
      return { success: false, message: 'Registration service is temporarily unavailable.' };
    }

    const status = settings.requireApprovalForUsers ? 'pending' : 'approved';

    // Sign up via Supabase Auth — the trigger will create a profile row
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, status },
        emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, message: 'Email is already registered.' };
      }
      return { success: false, message: error.message };
    }

    // Sign out immediately so they can't browse until approved
    await supabase.auth.signOut();

    if (status === 'approved') {
      return { success: true, message: 'Account created! You can now log in.' };
    }
    return { success: true, message: 'Account created! Please wait for admin approval before logging in.' };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updated = await db.updateUser(user.id, updates);
    if (updated) setUser(updated);
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const u = await db.getUserById(user.id);
    if (u) setUser(u);
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    // The SECURITY DEFINER RPC removes auth.users; profile and authored data
    // are removed through foreign-key cascades.
    await db.deleteUser(user.id);
    // Sign out
    await supabase.auth.signOut();
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile, refreshUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
