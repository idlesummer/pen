import type { FunctionComponent, ReactNode } from 'react'
import { Suspense } from 'react'

// ── component ────────────────────────────────────────────────────────────

/** A loading component rendered while its content is suspended. */
export type LoadingComponent = FunctionComponent

// ── boundary ─────────────────────────────────────────────────────────────

type LoadingBoundaryProps = {
  Fallback: LoadingComponent
  children: ReactNode
}

/** Shows the loading component while its children are suspended. */
export function LoadingBoundary({ Fallback, children }: LoadingBoundaryProps) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}
