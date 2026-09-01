import { useAuth as useAuthStore } from '../store/authStore';

export function useAuth() {
  return useAuthStore((s) => ({
    user: s.user,
    session: s.session,
    initialized: s.initialized,
    loading: s.loading,
    signIn: s.signIn,
    signUp: s.signUp,
    signOut: s.signOut,
    error: s.error,
    clearError: s.clearError,
  }));
}

export function useUser() {
  const user = useAuthStore((s) => s.user);
  return user;
}
