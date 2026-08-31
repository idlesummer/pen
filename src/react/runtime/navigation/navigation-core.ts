type NavigationHistory = {
  url: string
  searchParams?: unknown
}

type NavigationSnapshot = {
  history: Readonly<NavigationHistory[]>
  position: number
}

/** Manages navigation history and exposes its current state. */
export class Navigation {
  private position = 0
  private history: NavigationHistory[]

  constructor(initialUrl: string) {
    this.history = [{ url: initialUrl }]
  }

  /* Navigation State */

  getSnapshot(): NavigationSnapshot {
    const history = this.history
    const position = this.position
    return { history, position }
  }

  /* Navigation Actions */

  push(url: string, searchParams?: unknown) {
    this.history.splice(this.position+1, Infinity, { url, searchParams })
    this.position++
  }

  replace(url: string, searchParams?: unknown) {
    this.history[this.position] = { url, searchParams }
  }

  /** Returns whether it actually moved, so the store knows whether to notify. */
  back(): boolean {
    return this.position > 0 && (this.position--, true)
  }

  /** Returns whether it actually moved, so the store knows whether to notify. */
  forward(): boolean {
    return this.position < this.history.length-1 && (this.position++, true)
  }
}
