import { useSyncExternalStore, type ReactNode } from 'react'
import { NavigationProvider } from '@/pen-react/navigation'
import { Router } from './Router'

export type PenAppProps = {
  matcherStore: {
    subscribe: (listener: () => void) => () => void
    getSnapshot: () => (url: string) => ReactNode
  }
}

/** Root component that provides navigation and renders the matched route. */
export function PenApp({ matcherStore }: PenAppProps) {
  const componentMatcher = useSyncExternalStore(matcherStore.subscribe, matcherStore.getSnapshot)
  return (
    <NavigationProvider>
      <Router componentMatcher={componentMatcher} />
    </NavigationProvider>
  )
}
