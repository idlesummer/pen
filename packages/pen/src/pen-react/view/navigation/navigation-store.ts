import type { Store } from '@/lib/create-store'
import type { NavigationState } from './navigation-core'
import { createStore } from '@/lib/create-store'
import {
  createNavigation,
  push,
  replace,
  back,
  forward,
  refresh,
} from './navigation-core'

export type NavigationStore = Omit<Store<NavigationState>, 'setState'> & {
  actions: {
    /** @param route - Route to navigate to. */
    push(route: string): void
    /** @param route - Route to navigate to. */
    replace(route: string): void
    /** Moves back one entry, if possible. */
    back(): void
    /** Moves forward one entry, if possible. */
    forward(): void
    /** Re-renders the current route without changing history. */
    refresh(): void
  }
}

export function createNavigationStore(initialRoute: string): NavigationStore {
  const store = createStore(createNavigation(initialRoute))
  const actions: NavigationStore['actions'] = {
    push: route =>    store.setState(state => push(state, route)),
    replace: route => store.setState(state => replace(state, route)),
    back: () =>       store.setState(back),
    forward: () =>    store.setState(forward),
    refresh: () =>    store.setState(refresh),
  }
  return {
    subscribe: store.subscribe,
    getState: store.getState,
    actions,
  }
}
