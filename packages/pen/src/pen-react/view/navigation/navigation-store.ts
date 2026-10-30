import type { NavigationState } from './navigation-core'
import { createListeners } from '@/lib/create-store'
import {
  createNavigation,
  push,
  replace,
  back,
  forward,
  refresh,
} from './navigation-core'

export type NavigationStore = {
  /** @param listener - Called after any navigation action that actually changed state.
   *  @returns A function that unsubscribes the listener. */
  subscribe: (listener: () => void) => (() => void)
  /** Bumped on every applied change - the value useSyncExternalStore tracks,
   *  so navigation state itself never has to be rebuilt just to be observed. */
  getVersion: () => number
  /** Returns the live, mutable navigation state. */
  getState: () => NavigationState
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
  const state = createNavigation(initialRoute)
  const { subscribe, notify } = createListeners()
  let version = 0

  /** Bumps the version and notifies - only called once an action actually applied. */
  function applyChange() {
    version++
    notify()
  }

  const actions: NavigationStore['actions'] = {
    push:    route => (push(state, route), applyChange()),
    replace: route => (replace(state, route), applyChange()),
    back:    () => back(state) && applyChange(),
    forward: () => forward(state) && applyChange(),
    refresh: () => (refresh(state), applyChange()),
  }

  return {
    subscribe,
    getVersion: () => version,
    getState: () => state,
    actions,
  }
}
