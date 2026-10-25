import type { ComponentMatcher } from './component-matcher'
import { createStore } from '@/lib/create-store'

export type ComponentMatcherStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => ComponentMatcher
  update: (matcher: ComponentMatcher) => void
}

export function createComponentMatcherStore(matcher: ComponentMatcher): ComponentMatcherStore {
  const store = createStore(matcher)
  return {
    subscribe: store.subscribe,
    getSnapshot: store.getState,
    update: (matcher) => store.setState(() => matcher),
  }
}
