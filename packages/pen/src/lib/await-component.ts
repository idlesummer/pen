import type { ReactNode } from 'react'
import { use } from 'react'

type AwaitComponentProps = {
  resolve: Promise<ReactNode>
}

/** Unwraps a promise of rendered content, suspending until it resolves.
 *  Requires a Suspense boundary in an ancestor.
 *
 *  @param resolve - A promise resolving to a rendered component.
 *  @returns The value resolved by the promise. */
export function AwaitComponent({ resolve }: AwaitComponentProps) {
  return use(resolve)
}
