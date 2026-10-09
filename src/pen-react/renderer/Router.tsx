import type { Matcher } from '@/pen-core/runtime'
import type { ComponentMap } from './types/component-map'
import { Fragment, useMemo } from 'react'
import { useNavigate } from '../navigation/hooks/use-navigate'
import { renderMatch } from './render'

export type RouterProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Re-matches the route on every navigation and renders the resulting tree.
 *  The root's guaranteed default (real or built-in) ensures every URL resolves.
 *
 *  The memo is load-bearing: async pages create promises while building the
 *  tree, and use() needs those same promises on Suspense retries. Rebuilding
 *  the tree on unrelated re-renders would create new promises indefinitely.
 *
 *  `refreshes` is in the deps so `router.refresh()` rebuilds the tree even
 *  though it leaves the pathname untouched, and keys the Fragment so the
 *  rebuilt subtree remounts instead of just re-rendering in place. */
export function Router({ matcher, componentMap }: RouterProps) {
  const { history, position, refreshes } = useNavigate()
  const pathname = history[position]!.url

  return useMemo(() => {
    const match = matcher(pathname)
    const tree = renderMatch(match, componentMap)
    return <Fragment key={refreshes}>{tree}</Fragment>
  }, [pathname, refreshes, matcher, componentMap])
}
