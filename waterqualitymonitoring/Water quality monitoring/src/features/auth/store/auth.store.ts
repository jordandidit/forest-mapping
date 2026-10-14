import { create } from 'zustand'
import type { AuthErrorState, AuthStatus, AuthUser } from '@/features/auth/types/auth.types'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  returnPath: string | null
  error: AuthErrorState | null
  redirectUri: string | null
  setInitializing: () => void
  setAuthenticated: (user: AuthUser | null) => void
  setUnauthenticated: (returnPath?: string | null) => void
  setError: (error: AuthErrorState, redirectUri?: string | null) => void
  setReturnPath: (path: string | null) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  status: 'initializing' as AuthStatus,
  user: null as AuthUser | null,
  returnPath: null as string | null,
  error: null as AuthErrorState | null,
  redirectUri: null as string | null,
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setInitializing: () =>
    set({
      status: 'initializing',
      error: null,
    }),
  setAuthenticated: (user) =>
    set({
      status: 'authenticated',
      user,
      error: null,
    }),
  setUnauthenticated: (returnPath = null) =>
    set({
      status: 'unauthenticated',
      user: null,
      returnPath,
      error: null,
    }),
  setError: (error, redirectUri = null) =>
    set({
      status: 'error',
      error,
      redirectUri,
      user: null,
    }),
  setReturnPath: (path) => set({ returnPath: path }),
  clearError: () => set({ error: null }),
  reset: () => set({ ...initialState }),
}))
