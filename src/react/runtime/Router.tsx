import type { Matcher } from '@/router/runtime'
import type { ComponentMap } from './renderer/component-map'
import { useMemo } from 'react'
import { usePathname } from './navigation/hooks/use-pathname'
import { renderMatch } from './renderer/render'

type RouterProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Re-matches the route on every navigation and renders the resulting
 *  tree - always something, since the root's guaranteed default (real or
 *  built-in) ensures every URL resolves to at least that.
 *
 *  The memo is load-bearing, not an optimization: an async page's promise is
 *  created while building this tree, and use() needs that same promise back
 *  on every Suspense retry. Rebuilding the tree on unrelated re-renders would
 *  hand it a fresh promise each time and never settle. Router sits above the
 *  boundaries it renders, so it's outside their retry scope and the memo
 *  survives. */
export function Router({ matcher, componentMap }: RouterProps) {
  const pathname = usePathname()
  const render = () => {
    const match = matcher(pathname)
    return renderMatch(match, componentMap)
  }
  return useMemo(render, [pathname, matcher, componentMap])
}
