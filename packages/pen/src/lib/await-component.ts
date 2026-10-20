import type { ReactNode } from 'react'
import { use } from 'react'

type AwaitComponentProps = {
  resolve: Promise<ReactNode>
}

/** Unwraps a promise of rendered content for the route's Suspense boundary.
 *  @param resolve - The promise to unwrap.
 *  @returns The resolved content. */
export function AwaitComponent({ resolve }: AwaitComponentProps) {
  return use(resolve)
}
