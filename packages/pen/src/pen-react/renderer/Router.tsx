import type { ReactNode } from 'react'
import { Fragment, useMemo } from 'react'
import { useNavigate } from '@/pen-react/navigation/hooks/use-navigate'

export type RouterProps = {
  componentMatcher: (pathname: string) => ReactNode
}

/** Re-matches and renders the route on navigation.
 *  The root default guarantees every URL resolves.
 *
 *  Memoization preserves async page promises across Suspense retries.
 *  `refreshes` rebuilds the tree and remounts the subtree on refresh,
 *  even when the pathname is unchanged. */
export function Router({ componentMatcher }: RouterProps) {
  const { history, position, refreshes } = useNavigate()
  const pathname = history[position]!.url

  // useMemo only triggers on any navigation action calls inside the tree
  return useMemo(
    () => {
      const routeElement = componentMatcher(pathname)
      return <Fragment key={refreshes}>{routeElement}</Fragment>
    },
    [
      pathname,         // changes when push/replace/back/forward is called
      refreshes,        // changes when refresh is called
      componentMatcher, // stable
    ],
  )
}
