import type { ComponentType } from 'react'
import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './component-map'
import { usePathname } from '../api/hooks/use-pathname'
import { renderNode } from './render'

type RouterProps = {
  match: Matcher
  componentMap: ComponentMap
  Default?: ComponentType
}

/** Re-matches the route on every navigation and renders the resulting
 *  tree, or `Default` when nothing matched at all - not even a `default.tsx`. */
export function Router({ match, componentMap, Default }: RouterProps) {
  const pathname = usePathname()
  const [, renderTree] = match(pathname)

  if (!renderTree)
    return Default ? <Default /> : null
  return renderNode(renderTree, componentMap)
}
