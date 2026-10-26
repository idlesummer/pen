import type { Store } from '@/lib/create-store'
import type { ModuleRegistry } from '@/pen-react/modules'
import type { ComponentMatcher } from './component-matcher'
import { createComponentMatcher } from './component-matcher'
import { createStore } from '@/lib/create-store'

export type ComponentMatcherStore = Store<ComponentMatcher>

export function createComponentMatcherStore(moduleRegistry: ModuleRegistry): ComponentMatcherStore {
  const matcher = createComponentMatcher(moduleRegistry)
  const store = createStore(matcher)
  return store
}
