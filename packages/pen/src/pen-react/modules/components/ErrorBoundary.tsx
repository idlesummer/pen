import type { ComponentProps, FunctionComponent, PropsWithChildren } from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Text } from 'ink'
import { normalizeError } from '@/lib/normalize-error'
import { FallbackSignal } from './FallbackBoundary'

export type ErrorComponent = FunctionComponent<{
  error: Error
  reset: () => void
}>

type ErrorBoundaryProps = PropsWithChildren<{
  Fallback?: ErrorComponent
  route: string
}>

/** Built-in fallback rendered when an app defines no root `error.tsx`. */
function ErrorFallback({ error }: ComponentProps<ErrorComponent>) {
  return <Text>Something went wrong: {`${error.message}\n\n${error.stack}`}</Text>
}

/** Catches render errors and renders the route's `error` module. */
export function ErrorBoundary({ Fallback=ErrorFallback, route, children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      resetKeys={[route]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <Fallback error={normalizeError(error)} reset={resetErrorBoundary} />
      )}
      onError={(error) => {
        if (error instanceof FallbackSignal)
          throw error
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
