import { AxiosError } from 'axios'

type FieldError = {
  field: string
  message: string
}

type RawApiError = {
  success: false
  message: string
  error?: FieldError[]
  timestamp?: string
}

export class ApiError extends Error {
  originalError: AxiosError
  statusCode: number
  formErrors: Record<string, string[]> | null

  constructor(
    message: string,
    originalError: AxiosError,
    statusCode: number,
    formErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
    this.originalError = originalError
    this.statusCode = statusCode
    this.formErrors = formErrors || null
  }
}

export function getStandardizedApiError(error: AxiosError): ApiError {
  const raw = error.response?.data as RawApiError
  const statusCode = error.response?.status ?? 500

  // Nếu là lỗi dạng mảng lỗi form
  if (raw?.error && Array.isArray(raw.error)) {
    const errors: Record<string, string[]> = {}
    for (const e of raw.error) {
      if (!errors[e.field]) errors[e.field] = []
      errors[e.field].push(e.message)
    }

    return new ApiError(
      raw.message || 'Validation error',
      error,
      statusCode,
      errors
    )
  }

  return new ApiError(raw?.message || 'Unknown error', error, statusCode)
}
