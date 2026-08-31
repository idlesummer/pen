type NavigationHistory = {
  url: string
  searchParams?: unknown
}

export class Navigation {
  private position = 0
  private history: NavigationHistory[]

  constructor(initialUrl='/') {
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
    if (this.position <= 0) return false
    this.position--
    return true
  }

  /** Returns whether it actually moved, so the store knows whether to notify. */
  forward(): boolean {
    if (this.position >= this.history.length-1) return false
    this.position++
    return true
  }

  get snapshot() {
    const history = this.history as Readonly<typeof this.history>
    const position = this.position
    return { history, position }
  }
}
