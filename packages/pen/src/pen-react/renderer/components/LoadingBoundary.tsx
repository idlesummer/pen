import type { FunctionComponent, ReactNode } from 'react'
import { Suspense } from 'react'

// doesn't accept anything for now
export type LoadingComponentProps = object

type LoadingBoundaryProps = {
  Fallback: FunctionComponent<LoadingComponentProps>
  children: ReactNode
}

/** Shows the loading component while its children are suspended. */
export function LoadingBoundary({ Fallback, children }: LoadingBoundaryProps) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}
