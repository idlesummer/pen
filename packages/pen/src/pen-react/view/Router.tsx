import { Fragment, useMemo } from 'react'
import type { RouteRenderer } from '@/pen-react/store'
import { useNavigate } from './navigation'

export type RouterProps = {
  routeRenderer: RouteRenderer
}

/** Re-matches and renders the route on navigation, or whenever the matcher
 *  store swaps in a freshly-loaded renderer (dev-time live reload).
 *  The root default guarantees every URL resolves.
 *
 *  Memoization preserves async page promises across Suspense retries.
 *  `refreshes` rebuilds the tree and remounts the subtree on refresh,
 *  even when the pathname is unchanged. */
export function Router({ routeRenderer }: RouterProps) {
  const { history, position, refreshes } = useNavigate()
  const pathname = history[position]!.url

  // useMemo only triggers on any navigation action calls inside the tree
  return useMemo(
    () => {
      const routeElement = routeRenderer(pathname)
      return <Fragment key={refreshes}>{routeElement}</Fragment>
    },
    [
      pathname,       // changes when push/replace/back/forward is called
      refreshes,      // changes when refresh is called
      routeRenderer,  // changes when the matcher store swaps one in
    ],
  )
}
