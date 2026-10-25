export type Store<T> = {
  subscribe: (listener: () => void) => (() => void)
  getState: () => T
  setState: (action: (prevState: T) => T) => void
}

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
    setState: (callback) => {
      const nextState = callback(state)

      if (!Object.is(state, nextState)) {
        state = nextState
        listeners.forEach(fn => fn())
      }
    },
  }
}
