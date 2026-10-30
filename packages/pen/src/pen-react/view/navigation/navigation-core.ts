/** Caps how many entries `history` can grow to - without this, a
 *  long-running session that pushes often would grow it forever. */
const HISTORY_LIMIT = 500

type NavigationSnapshot = {
  history: Readonly<string[]>
  position: number
  refreshes: number
}

/** Manages navigation history and exposes its current state. */
export class Navigation {
  private position = 0
  private refreshes = 0
  private history: string[]

  constructor(initialRoute: string) {
    this.history = [initialRoute]
  }

  /* Navigation State */

  getSnapshot(): NavigationSnapshot {
    const history = this.history
    const position = this.position
    const refreshes = this.refreshes
    return { history, position, refreshes }
  }

  /* Navigation Actions */

  push(route: string) {
    this.history.splice(this.position+1, Infinity, route)
    this.position++

    const overflow = this.history.length - HISTORY_LIMIT
    if (overflow > 0) {
      this.history.splice(0, overflow)
      this.position -= overflow
    }
  }

  replace(route: string) {
    this.history[this.position] = route
  }

  /** Returns whether it actually moved, so the store knows whether to notify. */
  back(): boolean {
    return this.position > 0 && (this.position--, true)
  }

  /** Returns whether it actually moved, so the store knows whether to notify. */
  forward(): boolean {
    return this.position < this.history.length-1 && (this.position++, true)
  }

  /** Bumps the refresh count without touching history, so the current route
   *  re-renders in place. */
  refresh() {
    this.refreshes++
  }
}
