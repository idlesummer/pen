export type Store<T> = {
  subscribe: (listener: () => void) => (() => void)
  getState: () => T
  setState: (nextState: T) => void
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
    setState: (nextState: T) => {
      if (Object.is(state, nextState)) return
      state = nextState
      listeners.forEach(fn => fn())
    },
  }
}
