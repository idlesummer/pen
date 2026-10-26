import { useSyncExternalStore } from 'react'
import type { RouteRendererStore } from '@/pen-react/store'
import { NavigationProvider } from './navigation'
import { Router } from './Router'

export type PenAppProps = {
  rendererStore: RouteRendererStore
}

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ rendererStore }: PenAppProps) {
  const routeRenderer = useSyncExternalStore(rendererStore.subscribe, rendererStore.getState)
  return (
    <NavigationProvider>
      <Router routeRenderer={routeRenderer} />
    </NavigationProvider>
  )
}
