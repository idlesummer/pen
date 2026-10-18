import type { Matcher } from '@/pen-core'
import type { ComponentMap } from './types/component-map'
import { Fragment, useMemo } from 'react'
import { useNavigate } from '@/pen-react/navigation/hooks/use-navigate'
import { createRouteElement } from './render'

export type RouterProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Re-matches and renders the route on navigation.
 *  The root default guarantees every URL resolves.
 *
 *  Memoization preserves async page promises across Suspense retries.
 *  `refreshes` rebuilds the tree and remounts the subtree on refresh,
 *  even when the pathname is unchanged. */
export function Router({ matcher, componentMap }: RouterProps) {
  const { history, position, refreshes } = useNavigate()
  const pathname = history[position]!.url

  // useMemo only triggers on any navigation action calls inside the tree
  return useMemo(
    () => {
      const match = matcher(pathname)
      const routeElement = createRouteElement(match, pathname, componentMap)
      return <Fragment key={refreshes}>{routeElement}</Fragment>
    },
    [
      pathname,     // changes when push/replace/back/forward is called
      refreshes,    // changes when refresh is called
      matcher,      // stable
      componentMap, // stable
    ],
  )
}
