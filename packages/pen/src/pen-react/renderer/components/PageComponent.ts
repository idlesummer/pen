import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '../types/params'

// ── component ────────────────────────────────────────────────────────────

/** Props passed to a page component. */
export type PageComponentProps = {
  params: Params
}

// ── utility ──────────────────────────────────────────────────────────────

/** Checks whether a component is declared with `async`.
 *
 *  Takes any component-shaped function, not just a page, since
 *  module validation checks entries from a map spanning every role.
 *
 *  @param Content - The component function to check.
 *  @returns Whether the component is declared with `async`. */
export function isAsyncComponent<T extends FunctionComponent<any>>(Content: T): Content is ((...args: Parameters<T>) => Promise<ReactNode>) & T {
  return Content.constructor.name === 'AsyncFunction'
}
