import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './renderer/component-map'
import { usePathname } from './navigation/hooks/use-pathname'
import { renderNode } from './renderer/render'

type RouterProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Re-matches the route on every navigation and renders the resulting
 *  tree - always something, since the root's guaranteed default (real or
 *  built-in) ensures every URL resolves to at least that. */
export function Router({ matcher, componentMap }: RouterProps) {
  const pathname = usePathname()
  const renderTree = matcher(pathname)
  return renderNode(renderTree, componentMap)
}
