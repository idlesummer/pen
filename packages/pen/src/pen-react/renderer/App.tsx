import type { RouterProps } from './Router'
import { NavigationProvider } from '../navigation/NavigationProvider'
import { Router } from './Router'

/** Props for the root Pen app component. */
export type PenAppProps = RouterProps

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ resolvedMatcher }: PenAppProps) {
  return (
    <NavigationProvider>
      <Router resolvedMatcher={resolvedMatcher} />
    </NavigationProvider>
  )
}
