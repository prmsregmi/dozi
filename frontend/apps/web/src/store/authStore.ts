import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: false,
      error: null,

      signInWithMagicLink: async (email: string) => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;

          // Success - user will receive email
          set({ loading: false });
        } catch (error: unknown) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to send magic link',
          });
        }
      },

      signOut: async () => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({ user: null, session: null, loading: false });
        } catch (error: unknown) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to sign out',
          });
        }
      },

      setSession: (session: Session | null) => {
        set({
          session,
          user: session?.user ?? null,
        });
      },

      checkSession: async () => {
        set({ loading: true });

        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          set({ session, user: session?.user ?? null, loading: false });
        } catch (error: unknown) {
          set({
            session: null,
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to check session',
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    }
  )
);
