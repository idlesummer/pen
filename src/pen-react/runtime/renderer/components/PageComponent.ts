import type { FunctionComponent, ReactNode } from 'react'
import type { Params } from '../types/params'

// ── component ────────────────────────────────────────────────────────────

/** Props passed to a page component. */
export type PageComponentProps = {
  params: Params
}

/** A page component. */
export type PageComponent = FunctionComponent<PageComponentProps>

/** An async page called outside React, with its result unwrapped by pen. */
export type AsyncPageComponent = (props: PageComponentProps) => Promise<ReactNode>

// ── utility ──────────────────────────────────────────────────────────────

/** Checks whether a component is declared with `async`.
 *
 *  Takes any component-shaped function, not just a page, since
 *  module validation checks entries from a map spanning every role.
 *
 *  @param Content - The component function to check.
 *  @returns Whether the component is declared with `async`. */
export function isAsyncComponent(Content: (props: never) => ReactNode | Promise<ReactNode>): Content is AsyncPageComponent {
  return Content.constructor.name === 'AsyncFunction'
}
