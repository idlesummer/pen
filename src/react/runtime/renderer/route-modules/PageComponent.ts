import type { FunctionComponent, ReactNode } from 'react'
import type { ParamTable } from './ParamTable'
import type { RouteComponent } from '../component-map'

type PageProps = { params: ParamTable }

/** Called by pen itself, outside React - the reconciler can't render a
 *  function that returns a promise, so the result is unwrapped inside the
 *  route's Suspense boundary instead. Can't use hooks for the same reason
 *  (there's no dispatcher outside render); render interactive children from
 *  it instead, the way a server component renders client ones. */
export type AsyncPageComponent =
  (props: PageProps) => Promise<ReactNode>

/** A page renders synchronously like any other component, or is declared
 *  async and suspends into its route's loading.tsx while it settles -
 *  FunctionComponent already covers both, since its own call signature
 *  returns `ReactNode | Promise<ReactNode>`. Not ComponentType: pen's route
 *  modules are always functions, the one exception (boundaries) being
 *  pen's own internal implementation, never something an app authors. */
export type PageComponent =
  FunctionComponent<PageProps>

/** Async pages are declared with `async`, so they're distinguishable before
 *  being called - which matters, since a sync page can't be called outside
 *  React without breaking its hooks. Takes any RouteComponent, not just a
 *  page, since module validation checks entries from a map spanning every
 *  role - the check itself is generic, just a constructor name. */
export function isAsyncComponent(Content: RouteComponent): Content is AsyncPageComponent {
  return Content.constructor.name === 'AsyncFunction'
}
