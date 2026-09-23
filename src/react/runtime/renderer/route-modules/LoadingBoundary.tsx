import type { FunctionComponent, ReactNode } from 'react'
import { Suspense } from 'react'

export type LoadingComponent = FunctionComponent<Record<string, never>>

type Props = {
  fallback: LoadingComponent
  children: ReactNode
}

/** Wraps Suspense - unlike ErrorBoundary/DefaultBoundary there's nothing to
 *  catch here (Suspense handles that itself), so no class/state is needed,
 *  just a home for LoadingComponent's type. */
export function LoadingBoundary({ fallback: Fallback, children }: Props) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}
