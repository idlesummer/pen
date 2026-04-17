type NavigationHistory = {
  url: string
  searchParams?: unknown
}

export const navigationStore = new class NavigationStore {
  private listeners = new Set<()=>void>()
  private position = 0
  private history: NavigationHistory[] = [{ url: '/' }]

  // ==== Event emitter ===============================================================================

  public subscribe(callback: ()=>void): ()=>void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)  // Return a delete function
  }

  private emit() {
    this.listeners.forEach(func => func())
  }

  // ==== Navigation =================================================================================

  public push(url: string, searchParams?: unknown) {
    this.history.splice(this.position+1, Infinity, { url, searchParams })
    this.position++
    this.emit()
  }

  public replace(url: string) {
    const searchParams = this.history[this.position].searchParams
    this.history[this.position] = { url, searchParams }
    this.emit()
  }

  public back() {
    if (this.position > 0) {
      this.position--
      this.emit()
    }
  }

  public forward() {
    if (this.position < this.history.length-1) {
      this.position++
      this.emit()
    }
  }

  public get url() {
    return this.history[this.position]!.url
  }

  public get searchParams() {
    return this.history[this.position]!.searchParams
  }

  public getSnapshot() {
    const history = this.history as readonly NavigationHistory[]
    const position = this.position
    return { history, position }
  }
}
