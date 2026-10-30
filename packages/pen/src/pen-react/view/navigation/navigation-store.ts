import type { NavigationState } from './navigation-core'
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
  const listeners = new Set<() => void>()
  let version = 0

  /** Bumps the version and notifies - only called once an action actually applied. */
  function notify() {
    version++
    listeners.forEach(listener => listener())
  }

  const actions: NavigationStore['actions'] = {
    push:    route => (push(state, route), notify()),
    replace: route => (replace(state, route), notify()),
    back:    () => back(state) && notify(),
    forward: () => forward(state) && notify(),
    refresh: () => (refresh(state), notify()),
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getVersion: () => version,
    getState: () => state,
    actions,
  }
}
