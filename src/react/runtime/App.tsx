import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './renderer/component-map'
import { NavigationProvider } from './navigation/NavigationProvider'
import { Router } from './Router'

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
