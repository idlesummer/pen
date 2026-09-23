import type { Matcher } from '@/core/runtime'
import type { ComponentMap } from './component-map'
import { useMemo } from 'react'
import { usePathname } from '../navigation/hooks/use-pathname'
import { renderMatch } from './render'

type RouterProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Re-matches the route on every navigation and renders the resulting tree.
 *  The root's guaranteed default (real or built-in) ensures every URL resolves.
 *
 *  The memo is load-bearing: async pages create promises while building the
 *  tree, and use() needs those same promises on Suspense retries. Rebuilding
 *  the tree on unrelated re-renders would create new promises indefinitely. */
export function Router({ matcher, componentMap }: RouterProps) {
  const pathname = usePathname()
  return useMemo(() => {
    const match = matcher(pathname)
    const tree = renderMatch(match, componentMap)
    return tree
  }, [pathname, matcher, componentMap])
}
