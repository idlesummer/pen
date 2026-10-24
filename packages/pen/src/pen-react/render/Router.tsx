import type { ComponentMatcherStore } from '@/pen-react/setup/component-matcher-store'
import { Fragment, useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from '@/pen-react/navigation/hooks/use-navigate'

export type RouterProps = {
  matcherStore: ComponentMatcherStore
}

/** Re-matches and renders the route on navigation, or whenever the matcher
 *  store swaps in a freshly-loaded matcher (dev-time live reload).
 *  The root default guarantees every URL resolves.
 *
 *  Memoization preserves async page promises across Suspense retries.
 *  `refreshes` rebuilds the tree and remounts the subtree on refresh,
 *  even when the pathname is unchanged. */
export function Router({ matcherStore }: RouterProps) {
  const { history, position, refreshes } = useNavigate()
  const pathname = history[position]!.url
  const componentMatcher = useSyncExternalStore(matcherStore.subscribe, matcherStore.getSnapshot)

  // useMemo only triggers on any navigation action calls inside the tree
  return useMemo(
    () => {
      const routeElement = componentMatcher(pathname)
      return <Fragment key={refreshes}>{routeElement}</Fragment>
    },
    [
      pathname,         // changes when push/replace/back/forward is called
      refreshes,        // changes when refresh is called
      componentMatcher, // changes when the matcher store swaps one in
    ],
  )
}
