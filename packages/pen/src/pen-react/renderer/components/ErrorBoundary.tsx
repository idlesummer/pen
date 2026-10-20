import type { PropsWithChildren } from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Text } from 'ink'
import { normalizeError } from '@/lib/normalize-error'
import { DefaultSignal } from './DefaultBoundary'

// ── fallback ─────────────────────────────────────────────────────────────

/** Props passed to an error component. */
type ErrorFallbackProps = {
  error: Error
  reset: () => void
}

/** Built-in fallback rendered when an app defines no root `error.tsx`. */
function ErrorFallback({ error }: ErrorFallbackProps) {
  return <Text>Something went wrong: {`${error.message}\n\n${error.stack}`}</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

type ErrorBoundaryProps = PropsWithChildren<{
  Fallback?: typeof ErrorFallback
  pathname: string
}>

/** Catches render errors and renders the route's `error` module. */
export function ErrorBoundary({ Fallback=ErrorFallback, pathname, children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      resetKeys={[pathname]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <Fallback error={normalizeError(error)} reset={resetErrorBoundary} />
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
