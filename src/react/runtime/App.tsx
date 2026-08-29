import type { ComponentType } from 'react'
import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './component-map'
import { NavigationProvider } from '../api/NavigationProvider'
import { usePathname } from '../api/hooks/use-pathname'
import { renderNode } from './render'

type AppProps = {
  match: Matcher
  componentMap: ComponentMap
  initialUrl?: string
  NotFound?: ComponentType
}

/** Root component: owns the navigation store for this app instance, seeded
 *  at `initialUrl`, and renders whatever the current URL matches. */
export function App({ match, componentMap, initialUrl, NotFound }: AppProps) {
  return (
    <NavigationProvider initialUrl={initialUrl}>
      <Router match={match} componentMap={componentMap} NotFound={NotFound} />
    </NavigationProvider>
  )
}

type RouterProps = {
  match: Matcher
  componentMap: ComponentMap
  NotFound?: ComponentType
}

/** Re-matches the route on every navigation and renders the resulting
 *  tree, or `NotFound` when the URL has no matching page. */
function Router({ match, componentMap, NotFound }: RouterProps) {
  const pathname = usePathname()
  const [hasPage, renderTree] = match(pathname)

  if (!hasPage || !renderTree)
    return NotFound ? <NotFound /> : null

  return renderNode(renderTree, componentMap)
}
