import type { NavigationSnapshot } from './navigation'
import { Navigation } from './navigation'

/** Adds store state and subscriptions around `Navigation`. */
class NavigationStoreCore {
  private listeners = new Set<() => void>()
  private navigation: Navigation
  private snapshot: NavigationSnapshot

  constructor(initialUrl: string) {
    this.navigation = new Navigation(initialUrl)
    this.snapshot = this.navigation.getSnapshot()
  }
  private emit() {
    this.snapshot = this.navigation.getSnapshot()
    this.listeners.forEach(fn => fn())
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    const unsubscribe = () => this.listeners.delete(listener)
    return unsubscribe
  }
  getSnapshot() {
    return this.snapshot
  }
  push(url: string, searchParams?: unknown) {
    this.navigation.push(url, searchParams)
    this.emit()
  }
  replace(url: string, searchParams?: unknown) {
    this.navigation.replace(url, searchParams)
    this.emit()
  }
  back() {
    if (this.navigation.back())
      this.emit()
  }
  forward() {
    if (this.navigation.forward())
      this.emit()
  }
}

export type NavigationStore =
  ReturnType<typeof createNavigationStore>

/** Creates an isolated navigation store seeded at `initialUrl`. */
export function createNavigationStore(initialUrl: string) {
  const store = new NavigationStoreCore(initialUrl)
  return {
    subscribe: store.subscribe.bind(store),
    getSnapshot: store.getSnapshot.bind(store),
    actions: {
      push: store.push.bind(store),
      replace: store.replace.bind(store),
      back: store.back.bind(store),
      forward: store.forward.bind(store),
    },
  }
}
