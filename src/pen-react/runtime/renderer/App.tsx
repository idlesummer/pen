import type { AppProps } from './setup/app-props'
import { NavigationProvider } from '../navigation/NavigationProvider'
import { Router } from './Router'

/** Root component: owns the navigation store for this app instance, seeded
 *  at the root, and renders whatever the current URL matches. */
export function App({ matcher, componentMap }: AppProps) {
  return (
    <NavigationProvider>
      <Router matcher={matcher} componentMap={componentMap} />
    </NavigationProvider>
  )
}
