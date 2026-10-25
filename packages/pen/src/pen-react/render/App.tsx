import { useSyncExternalStore, type ReactNode } from 'react'
import type { Store } from '@/lib/create-store'
import { NavigationProvider } from '@/pen-react/navigation'
import { Router } from './Router'

/** Resolves a pathname straight to a rendered route element. Mirrors
 *  setup/component-matcher.ts's ComponentMatcher - render can't import it
 *  directly, since setup depends on render (through resolver), and
 *  importing back would create a cycle. */
type ComponentMatcher = (url: string) => ReactNode

export type PenAppProps = {
  matcherStore: Store<ComponentMatcher>
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
