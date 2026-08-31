type NavigationHistory = {
  url: string
  searchParams?: unknown
}

export type NavigationSnapshot = {
  history: Readonly<NavigationHistory[]>
  position: number
}

export class Navigation {
  private position = 0
  private history: NavigationHistory[]

  constructor(initialUrl: string) {
    this.history = [{ url: initialUrl }]
  }

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

  getSnapshot(): NavigationSnapshot {
    const history = this.history
    const position = this.position
    return { history, position }
  }
}
