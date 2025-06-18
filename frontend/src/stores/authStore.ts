import { persist } from 'zustand/middleware'
import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  setAuthData: (
    isAuthenticated: boolean,
    accessToken: string | null,
    refreshToken: string | null,
  ) => void
  clearTokens: () => void
  updateToken: (accessToken: string, refreshToken: string) => void
}

const authStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      setAuthData: (
        isAuthenticated: boolean,
        accessToken: string | null,
        refreshToken: string | null
      ): void =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated,
        }),
      clearTokens: (): void =>
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        }),
      updateToken: (accessToken: string, refreshToken: string): void =>
        set({
          accessToken,
          refreshToken,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
export default authStore
