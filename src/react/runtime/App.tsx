import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './rendering/component-map'
import { NavigationProvider } from './navigation/NavigationProvider'
import { Router } from './Router'

type AppProps = {
  matcher: Matcher
  componentMap: ComponentMap
  initialUrl?: string
}

/** Root component: owns the navigation store for this app instance, seeded
 *  at `initialUrl`, and renders whatever the current URL matches. */
export function App({ matcher, componentMap, initialUrl }: AppProps) {
  return (
    <NavigationProvider initialUrl={initialUrl}>
      <Router matcher={matcher} componentMap={componentMap} />
    </NavigationProvider>
  )
}
