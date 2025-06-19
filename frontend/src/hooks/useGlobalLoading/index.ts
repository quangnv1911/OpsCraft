import loadingStore from '@/stores/loadingStore'

export const useGlobalLoading = () => {
  const { showLoading, hideLoading, isLoading } = loadingStore()

  return {
    showLoading,
    hideLoading,
    isLoading,
  }
}
