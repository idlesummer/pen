import type { RouteRenderer } from '@/pen-react/renderer'
import { useInput } from 'ink'
import { NavigationProvider } from './navigation'
import { Router } from './Router'

export type PenAppProps = {
  routeRenderer: RouteRenderer
}

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ routeRenderer }: PenAppProps) {
  // Ink only enables raw mode (and with it, Ctrl+C detection) once something
  // calls useInput() - an app with no input handling of its own would
  // otherwise silently ignore Ctrl+C despite Ink's exitOnCtrlC default.
  useInput(() => {})

  return (
    <NavigationProvider>
      <Router routeRenderer={routeRenderer} />
    </NavigationProvider>
  )
}
