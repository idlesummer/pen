import { Navigation } from './navigation-core'

/** Adds store state and subscriptions around `Navigation`. */
export class NavigationStore {
  private listeners
  private navigation
  private snapshot
  readonly actions

  constructor(initialUrl: string) {
    this.listeners = new Set<() => void>()
    this.navigation = new Navigation(initialUrl)
    this.snapshot = this.navigation.getSnapshot()

    this.actions = {
      push:    this.push.bind(this),
      replace: this.replace.bind(this),
      back:    this.back.bind(this),
      forward: this.forward.bind(this),
    }
  }

  /* Store interface */
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    const unsubscribe = () => this.listeners.delete(listener)
    return unsubscribe
  }

  getSnapshot() {
    return this.snapshot
  }

  /* Navigation actions */
  private push(url: string, searchParams?: unknown) {
    this.navigation.push(url, searchParams)
    this.emit()
  }

  private replace(url: string, searchParams?: unknown) {
    this.navigation.replace(url, searchParams)
    this.emit()
  }

  private back() {
    if (this.navigation.back())
      this.emit()
  }

  private forward() {
    if (this.navigation.forward())
      this.emit()
  }

  /* Internal */
  private emit() {
    this.snapshot = this.navigation.getSnapshot()
    this.listeners.forEach(listener => listener())
  }
}
