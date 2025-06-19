import { create } from 'zustand'

interface LoadingState {
  isLoading: boolean
  loadingMessage?: string
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const loadingStore = create<LoadingState>()(set => ({
  isLoading: false,
  loadingMessage: undefined,
  showLoading: (message?: string): void =>
    set({
      isLoading: true,
      loadingMessage: message,
    }),
  hideLoading: (): void =>
    set({
      isLoading: false,
      loadingMessage: undefined,
    }),
}))

export default loadingStore
