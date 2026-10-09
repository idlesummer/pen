import type { Matcher } from '@/pen-core/runtime'
import type { ComponentMap } from './types/component-map'
import { Fragment, useMemo } from 'react'
import { useNavigate } from '../navigation/hooks/use-navigate'
import { renderMatch } from './render'

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

  return useMemo(() => {
    const match = matcher(pathname)
    const tree = renderMatch(match, componentMap)
    return <Fragment key={refreshes}>{tree}</Fragment>
  }, [pathname, refreshes, matcher, componentMap])
}
