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
  /** Computes and sets the next state.
   *  Subscribers are notified only when the next state differs from the current state.
   *  @param action - A function that receives the current state and returns the next state.
   */
  setState: (action: (prevState: T) => T) => void
}

/** Creates a store with an initial state.
 *  @param initialState - The initial state.
 *  @returns A store that exposes state access, updates, and subscriptions.
 */
export function createStore<T>(initialState: T): Store<T> {
  const listeners = new Set<() => void>()
  let state = initialState

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState: () => {
      return state
    },
    setState: (action) => {
      const nextState = action(state)

      if (!Object.is(state, nextState)) {
        state = nextState
        listeners.forEach(fn => fn())
      }
    },
  }
}
