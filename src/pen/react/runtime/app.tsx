import type { ComponentType } from 'react'
import type { Matcher } from '@/pen/router/matcher'
import type { ComponentMap } from './component-map'
import { usePathname } from '../api/hooks/use-pathname'
import { renderNode } from './render'

type AppProps = {
  match: Matcher
  componentMap: ComponentMap
  NotFound?: ComponentType
}

/** Root component: re-matches the route on every navigation and renders
 *  the resulting tree, or `NotFound` when the URL has no matching page. */
export function App({ match, componentMap, NotFound }: AppProps) {
  const pathname = usePathname()
  const [hasPage, renderTree] = match(pathname)

  if (!hasPage || !renderTree)
    return NotFound ? <NotFound /> : null

  return renderNode(renderTree, componentMap)
}
