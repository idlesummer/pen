import type { RouteRenderer } from '@/pen-react/renderer'
import { NavigationProvider } from './navigation'
import { Router } from './Router'

export type PenAppProps = {
  routeRenderer: RouteRenderer
}

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ routeRenderer }: PenAppProps) {
  return (
    <NavigationProvider>
      <Router routeRenderer={routeRenderer} />
    </NavigationProvider>
  )
}
