import { ExtendedQueryMeta } from '@/api/types/types'
import { StandardizedApiError } from '@/context/apiClient/apiClientContextController/apiError/apiError.types'

export const useHandleQueryErrors = () => {
  const handleErrors = (error: StandardizedApiError) => {}

  const shouldHandleGlobalError = (
    metaError?: ExtendedQueryMeta['error'],
    errorCode?: number
  ) => {
    if (!errorCode || !metaError) {
      return false
    }

    return (
      metaError.showGlobalError && !metaError.excludedCodes.includes(errorCode)
    )
  }

  return { handleErrors, shouldHandleGlobalError }
}
