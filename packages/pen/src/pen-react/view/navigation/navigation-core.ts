export type NavigationState = {
  history: string[]
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

/** Pushes a new route, truncating any forward history. Mutates state in place. */
export function push(state: NavigationState, route: string): void {
  state.history.splice(state.position + 1, Infinity, route)
  state.position++

  const overflow = state.history.length - HISTORY_LIMIT
  if (overflow > 0) {
    state.history.splice(0, overflow)
    state.position -= overflow
  }
}

/** Replaces the current navigation history entry. Mutates state in place. */
export function replace(state: NavigationState, route: string): void {
  state.history[state.position] = route
}

/** Moves backward in navigation history.
 *  @returns Whether it actually moved. */
export function back(state: NavigationState): boolean {
  return state.position > 0 && (state.position--, true)
}

/** Moves forward in navigation history.
 *  @returns Whether it actually moved. */
export function forward(state: NavigationState): boolean {
  return state.position < state.history.length-1 && (state.position++, true)
}

/** Refreshes the current route without changing history. Mutates state in place. */
export function refresh(state: NavigationState): void {
  state.refreshes++
}
