import type { FunctionComponent, ReactNode } from 'react'
import { Suspense } from 'react'

export type LoadingComponent =
  FunctionComponent  // doesnt accept anything for now

type LoadingBoundaryProps = {
  Fallback: LoadingComponent
  children: ReactNode
}

/** Shows the loading component while its children are suspended. */
export function LoadingBoundary({ Fallback, children }: LoadingBoundaryProps) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}
