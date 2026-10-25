import type { ComponentMatcher } from './component-matcher'
import type { Store } from '@/lib/create-store'
import { createStore } from '@/lib/create-store'

export type ComponentMatcherStore = Store<ComponentMatcher>

export function createComponentMatcherStore(matcher: ComponentMatcher): ComponentMatcherStore {
  return createStore(matcher)
}
