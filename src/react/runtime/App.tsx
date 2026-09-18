import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './renderer/component-map'
import { NavigationProvider } from './navigation/NavigationProvider'
import { Router } from './Router'

/** @deprecated Built against the old router's Matcher (url) => RenderNode.
 *  The router now returns MatchNode, and there is no RenderNode/render step
 *  to feed it - needs a rewrite against the new pipeline. */

type AppProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Root component: owns the navigation store for this app instance, seeded
 *  at the root, and renders whatever the current URL matches. */
export function App({ matcher, componentMap }: AppProps) {
  return (
    <NavigationProvider>
      <Router matcher={matcher} componentMap={componentMap} />
    </NavigationProvider>
  )
}
