import type { ComponentType } from 'react'
import type { Matcher } from '@/router/matcher'
import type { ComponentMap } from './component-map'
import { NavigationProvider } from '../api/NavigationProvider'
import { Router } from './Router'

type AppProps = {
  matcher: Matcher
  componentMap: ComponentMap
  initialUrl?: string
  Default?: ComponentType
}

/** Root component: owns the navigation store for this app instance, seeded
 *  at `initialUrl`, and renders whatever the current URL matches. */
export function App({ matcher, componentMap, initialUrl, Default }: AppProps) {
  return (
    <NavigationProvider initialUrl={initialUrl}>
      <Router matcher={matcher} componentMap={componentMap} Default={Default} />
    </NavigationProvider>
  )
}
