import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';

type AuthError = { message: string; __raw?: any };

type AuthState = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  loading: boolean;
  error: AuthError | null;
};

type AuthActions = {
  initialize: () => Promise<() => void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuth = create<AuthState & AuthActions>((set) => ({
  user: null,
  session: null,
  initialized: false,
  loading: true,
  error: null,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    set({ session, user: session?.user ?? null });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      set({
        session: newSession,
        user: newSession?.user ?? null,
        initialized: true,
        loading: false,
      });
    });
    set({ initialized: true, loading: false });
    return () => listener?.subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    const err = error ? { message: error.message, __raw: error } : null;
    set({ user: data.user ?? null, session: data.session ?? null, loading: false, error: err });
    return { error: err };
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    const err = error ? { message: error.message, __raw: error } : null;
    const needsEmailConfirmation = Boolean(data?.user) && !data?.session;
    set({ user: data.user ?? null, session: data.session ?? null, loading: false, error: err });
    return { error: err, needsEmailConfirmation };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  clearError: () => set({ error: null }),
}));
