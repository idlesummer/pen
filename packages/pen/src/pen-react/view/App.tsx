import { useSyncExternalStore } from 'react'
import type { ComponentMatcherStore } from '@/pen-react/store'
import { NavigationProvider } from '@/pen-react/navigation'
import { Router } from './Router'

export type PenAppProps = {
  matcherStore: ComponentMatcherStore
}

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ matcherStore }: PenAppProps) {
  const componentMatcher = useSyncExternalStore(matcherStore.subscribe, matcherStore.getState)
  return (
    <NavigationProvider>
      <Router componentMatcher={componentMatcher} />
    </NavigationProvider>
  )
}
