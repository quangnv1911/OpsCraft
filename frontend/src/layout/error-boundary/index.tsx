import { ReactNode } from 'react'
import { FallbackProps } from 'react-error-boundary'

const FallbackRender: (props: FallbackProps) => ReactNode = ({
  error,
  resetErrorBoundary,
}: {
  error: Record<'message', string>
  resetErrorBoundary: FallbackProps['resetErrorBoundary']
}) => {
  return (
    <div role="alert">
      <span>Something went wrong:</span>
      <pre className="text-red-500">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default FallbackRender
