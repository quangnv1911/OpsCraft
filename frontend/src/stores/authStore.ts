import { persist } from 'zustand/middleware';
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  userName: string | null;
  email: string | null;
  image: string;
  setAuthData: (
    accessToken: string | null,
    refreshToken: string | null,
    role: string,
    userName: string,
    email: string,
    image: string,
    isAuthenticated: boolean,
  ) => void;
  clearTokens: () => void;
  updateToken: (accessToken: string, refreshToken: string) => void;
}

const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      role: null,
      userName: null,
      email: null,
      image: '',
      setAuthData: (
        accessToken: string | null,
        refreshToken: string | null,
        role: string,
        userName: string,
        email: string,
        image: string,
        isAuthenticated: boolean,
      ): void =>
        set({
          accessToken,
          refreshToken,
          role,
          userName,
          email,
          image,
          isAuthenticated,
        }),
      clearTokens: (): void =>
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          role: null,
          userName: null,
          email: null,
          image: '',
        }),
      getRole: (): string | null => get().role,
      updateToken: (accessToken: string, refreshToken: string): void =>
        set({
          accessToken,
          refreshToken,
        }),
    }),
    {
      name: 'app-storage',
    },
  ),
);
export default authStore;
