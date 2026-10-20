import type { PropsWithChildren } from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Text } from 'ink'
import { DefaultSignal } from './DefaultBoundary'

// ── fallback ─────────────────────────────────────────────────────────────

/** Props passed to an error component. */
export type ErrorFallbackProps = {
  error: Error
  reset: () => void
}

/** Built-in fallback rendered when an app defines no root `error.tsx`. */
export function ErrorFallback({ error }: ErrorFallbackProps) {
  return <Text>Something went wrong: {error.message}{'\n\n'}{error.stack}</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

type ErrorBoundaryProps = PropsWithChildren<{
  fallback: typeof ErrorFallback
  pathname: string
}>

export function ErrorBoundary({ fallback: Fallback, pathname, children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      resetKeys={[pathname]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <Fallback error={error as Error} reset={resetErrorBoundary} />
      )}
      onError={(error) => {
        if (error instanceof DefaultSignal)
          throw error
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
