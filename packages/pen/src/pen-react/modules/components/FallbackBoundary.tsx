import type { ComponentProps, FunctionComponent, PropsWithChildren } from 'react'
import type { MatchParams } from '@/pen-core'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Text } from 'ink'

// ── signal ───────────────────────────────────────────────────────────────

/** Thrown by notFound() to trigger the nearest fallback boundary. */
export class FallbackSignal extends Error {}

/** Replaces the current content with its nearest fallback component. */
export function showFallback() {
  throw new FallbackSignal()
}

// ── boundary ─────────────────────────────────────────────────────────────

export type FallbackComponent = FunctionComponent<{
  params: MatchParams
}>

type FallbackBoundaryProps = PropsWithChildren<{
  Fallback?: FallbackComponent
  route: string
  params: MatchParams
}>

/** Built-in fallback when no root fallback.tsx is defined. */
function _Fallback({ }: ComponentProps<FallbackComponent>) { // eslint-disable-line no-empty-pattern
  return <Text>Page Not Found</Text>
}

/** Catches notFound() and renders this position's fallback component.
 *  Other errors are re-thrown for the nearest error boundary. */
export function FallbackBoundary({ Fallback=_Fallback, route, params, children }: FallbackBoundaryProps) {
  return (
    <ReactErrorBoundary
      resetKeys={[route]}
      fallbackRender={() => <Fallback params={params} />}
      onError={(error) => {
        if (!(error instanceof FallbackSignal))
          throw error
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
