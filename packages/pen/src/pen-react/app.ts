import type { ModuleRegistry } from '@/pen-react/modules'
import { createComponentMatcher, createComponentMatcherStore, ROUTES_CHANGED_EVENT, type ComponentMatcherStore } from './setup'
import { PenApp } from './render'

export { PenApp, ROUTES_CHANGED_EVENT }
export type { ComponentMatcherStore }

/** Builds the reactive store PenApp reads its matcher from, out of a raw module registry. */
export function createMatcherStore(moduleRegistry: ModuleRegistry): ComponentMatcherStore {
  return createComponentMatcherStore(createComponentMatcher(moduleRegistry))
}

/** Rebuilds the matcher from a fresh module registry and pushes it into an
 *  already-running store, so a live app picks up added or removed routes
 *  without restarting. */
export function updateMatcherStore(store: ComponentMatcherStore, moduleRegistry: ModuleRegistry): void {
  store.setState(() => createComponentMatcher(moduleRegistry))
}
