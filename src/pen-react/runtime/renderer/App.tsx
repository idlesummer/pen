import type { Matcher } from '@/pen-core'
import type { ComponentMap } from './types/component-map'
import { NavigationProvider } from '../navigation/NavigationProvider'
import { Router } from './Router'

/** Props for the root Pen app component. */
type PenAppProps = {
  matcher: Matcher
  componentMap: ComponentMap
}

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ matcher, componentMap }: PenAppProps) {
  return (
    <NavigationProvider>
      <Router matcher={matcher} componentMap={componentMap} />
    </NavigationProvider>
  )
}
