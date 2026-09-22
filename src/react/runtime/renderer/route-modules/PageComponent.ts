import type { ComponentType, ReactNode } from 'react'
import type { ParamTable } from './ParamTable'

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
 *  ComponentType already covers both, since FunctionComponent's own call
 *  signature returns `ReactNode | Promise<ReactNode>`. */
export type PageComponent =
  ComponentType<PageProps>
