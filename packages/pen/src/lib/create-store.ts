/** Tracks a set of listeners and notifies them, independent of what changed. */
function createListeners() {
  const listeners = new Set<() => void>()
  return {
    /** Subscribes to notifications.
     *  @param listener - The function to call when notified.
     *  @returns A function that unsubscribes the listener.
     */
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    /** Calls every subscribed listener. */
    notify: () => listeners.forEach(listener => listener()),
  }
}

/** A store that holds state and notifies subscribers when it changes. */
export type Store<T> = {
  /** Subscribes to state changes.
   *  @param listener - The function to call when the state changes.
   *  @returns A function that unsubscribes the listener.
   */
  subscribe: (listener: () => void) => (() => void)
  /** Returns the current state.
   *  @returns The current state.
   */
  getState: () => T
  /** Bumped every time setState or mutate actually applies a change.
   *  @returns The current version. */
  getVersion: () => number
  /** Computes and sets the next state.
   *  Subscribers are notified only when the next state differs from the current state.
   *  @param action - A function that receives the current state and returns the next state.
   */
  setState: (action: (prevState: T) => T) => void
  /** Mutates the current state in place, for state too costly to rebuild wholesale.
   *  Subscribers are notified unless the action reports no change by returning false.
   *  @param action - A function that mutates the current state, returning false if it didn't change.
   */
  mutate: (action: (state: T) => boolean | void) => void
}

/** Creates a store with an initial state.
 *  @param initialState - The initial state.
 *  @returns A store that exposes state access, updates, and subscriptions.
 */
export function createStore<T>(initialState: T): Store<T> {
  const { subscribe, notify } = createListeners()
  let state = initialState
  let version = 0

  /** Bumps the version and notifies - only called once a change actually applied. */
  function applyChange() {
    version++
    notify()
  }

  return {
    subscribe,
    getState: () => {
      return state
    },
    getVersion: () => version,
    setState: (action) => {
      const nextState = action(state)

      if (!Object.is(state, nextState)) {
        state = nextState
        applyChange()
      }
    },
    mutate: (action) => {
      if (action(state) !== false)
        applyChange()
    },
  }
}
