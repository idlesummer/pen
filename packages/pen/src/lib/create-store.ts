/** A store that holds state and notifies subscribers when it changes. */
export type Store<T> = {
  /** Subscribes to state changes.
   *  @param listener - The function to call when the state changes.
   *  @returns A function that unsubscribes the listener.
   */
  subscribe: (listener: () => void) => (() => void)
  /** @returns The current state. */
  getState: () => T
  /** Bumped every time setState or mutate actually applies a change.
   *  @returns The current version.
   */
  getVersion: () => number
  /** Computes and sets the next state.
   *  Subscribers are notified only when the next state differs from the current state.
   *  @param action - A function that receives the current state and returns the next state.
   */
  setState: (action: (prevState: T) => T) => void
  /** Mutates the current state in place and always notifies subscribers.
   *  @param action - A function that mutates the current state.
   */
  mutate: (action: (state: T) => void) => void
}

/** Creates a store with an initial state.
 *  @param initialState - The initial state.
 *  @returns A store that exposes state access, updates, and subscriptions.
*/
export function createStore<T>(initialState: T): Store<T> {
  const listeners = new Set<() => void>()
  let state = initialState
  let version = 0

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    // Immutable operations
    getState: () => {
      return state
    },
    setState: (action) => {
      const nextState = action(state)
      if (Object.is(state, nextState)) {
        state = nextState
        version++
        listeners.forEach(fn => fn())
      }
    },
    // Mutable operations
    getVersion: () => {
      return version
    },
    mutate: (action) => {
      action(state)
      version++
      listeners.forEach(fn => fn())
    },
  }
}
