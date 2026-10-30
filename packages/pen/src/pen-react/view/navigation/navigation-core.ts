export type NavigationState = {
  history: Readonly<string[]>
  position: number
  refreshes: number
}

/** Caps how many entries `history` can grow to. */
const HISTORY_LIMIT = 500

export function createNavigation(initialRoute: string): NavigationState {
  return {
    history: [initialRoute],
    position: 0,
    refreshes: 0,
  }
}

export function push(state: NavigationState, route: string): NavigationState {
  const history = state.history.slice(0, state.position+1)
  history.push(route)

  const overflow = history.length - HISTORY_LIMIT
  if (overflow > 0)
    history.splice(0, overflow)
  return { ...state, history, position: history.length-1 }
}

/** Replaces the current navigation history entry. */
export function replace(state: NavigationState, route: string): NavigationState {
  const history = [...state.history]
  history[state.position] = route
  return { ...state, history }
}

/** Moves backward in navigation history. */
export function back(state: NavigationState): NavigationState {
  return state.position > 0
    ? { ...state, position: state.position - 1 }
    : state
}

/** Moves forward in navigation history. */
export function forward(state: NavigationState): NavigationState {
  return state.position < state.history.length - 1
    ? { ...state, position: state.position + 1 }
    : state
}

/** Refreshes the current route without changing history. */
export function refresh(state: NavigationState): NavigationState {
  return { ...state, refreshes: state.refreshes + 1 }
}
