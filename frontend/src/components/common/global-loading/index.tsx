import loadingStore from '@/stores/loadingStore'

export const GlobalLoading = () => {
  const { isLoading, loadingMessage } = loadingStore()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 shadow-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-solid" />
        {loadingMessage && (
          <p className="text-gray-700 text-sm font-medium">{loadingMessage}</p>
        )}
      </div>
    </div>
  )
}
