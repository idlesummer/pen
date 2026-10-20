import type { PropsWithChildren } from 'react'
import type { Params } from '@/pen-react/renderer/types/params'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Text } from 'ink'

// ── fallback ─────────────────────────────────────────────────────────────

type DefaultFallbackProps = {
  params: Params
}

/** Built-in fallback when no root default.tsx is defined. */
function DefaultFallback({ }: DefaultFallbackProps) { // eslint-disable-line no-empty-pattern
  return <Text>Page Not Found</Text>
}

// ── boundary ─────────────────────────────────────────────────────────────

type DefaultBoundaryProps = PropsWithChildren<{
  Fallback?: typeof DefaultFallback
  pathname: string
  params: Params
}>

/** Catches notFound() and renders this position's default component.
 *  Other errors are re-thrown for the nearest error boundary. */
export function DefaultBoundary({ Fallback=DefaultFallback, pathname, params, children }: DefaultBoundaryProps) {
  return (
    <ReactErrorBoundary
      resetKeys={[pathname]}
      fallbackRender={() => <Fallback params={params} />}
      onError={(error) => {
        if (!(error instanceof DefaultSignal))
          throw error
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}

// ── signal ───────────────────────────────────────────────────────────────

/** Thrown by notFound() to trigger the nearest default boundary. */
export class DefaultSignal extends Error {}

/** Replaces the current content with its nearest default component. */
export function notFound() {
  throw new DefaultSignal()
}
