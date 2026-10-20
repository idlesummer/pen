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

/** Checks whether a component is declared with `async`.
 *
 *  Takes any component-shaped function, not just a page, since
 *  module validation checks entries from a map spanning every role.
 *
 *  @param Content - The component function to check.
 *  @returns Whether the component is declared with `async`. */
export function isAsyncComponent<T extends (...args: never[]) => unknown>(Content: T): Content is ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) & T {
  return Content.constructor.name === 'AsyncFunction'
}
