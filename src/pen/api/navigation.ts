type NavigationHistory = {
  url: string
  searchParams?: unknown
}

export class Navigation {
  private position: number
  private history: NavigationHistory[]

  constructor() {
    this.position = 0
    this.history = [{ url: '/' }]
  }

  push(url: string, searchParams?: unknown) {
    this.history.splice(this.position+1, Infinity, { url, searchParams })
    this.position++
  }

  replace(url: string, searchParams?: unknown) {
    this.history[this.position] = { url, searchParams }
  }

  back() {
    if (this.position > 0)
      this.position--
  }

  forward() {
    if (this.position < this.history.length-1)
      this.position++
  }

  get snapshot() {
    return {
      history: this.history as readonly NavigationHistory[],
      position: this.position,
    }
  }
}
