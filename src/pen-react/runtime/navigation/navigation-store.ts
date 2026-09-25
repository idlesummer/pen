import { Navigation } from './navigation-core'

/** Stateful store around {@link Navigation}.
 *  The class owns its store state, while bound fields form the public interface
 *  so consumers can pass them directly without invoking or binding methods. */
export class NavigationStore {
  private listeners
  private navigation
  private snapshot

  /** Public store interface. */
  readonly subscribe
  readonly getSnapshot
  readonly actions

  constructor(initialUrl: string) {
    this.listeners = new Set<() => void>()
    this.navigation = new Navigation(initialUrl)
    this.snapshot = this.navigation.getSnapshot()

    this.subscribe = this.subscribeListeners.bind(this)
    this.getSnapshot = this.getNavigationSnapshot.bind(this)
    this.actions = {
      push:    this.pushUrl.bind(this),
      replace: this.replaceUrl.bind(this),
      back:    this.goBack.bind(this),
      forward: this.goForward.bind(this),
    }
  }

  /* Store interface */

  private subscribeListeners(listener: () => void) {
    this.listeners.add(listener)
    const unsubscribe = () => this.listeners.delete(listener)
    return unsubscribe
  }

  private getNavigationSnapshot() {
    return this.snapshot
  }

  /* Navigation actions */

  private pushUrl(url: string, searchParams?: unknown) {
    this.navigation.push(url, searchParams)
    this.emit()
  }

  private replaceUrl(url: string, searchParams?: unknown) {
    this.navigation.replace(url, searchParams)
    this.emit()
  }

  private goBack() {
    if (this.navigation.back())
      this.emit()
  }

  private goForward() {
    if (this.navigation.forward())
      this.emit()
  }

  /* Internal helpers */

  private emit() {
    this.snapshot = this.navigation.getSnapshot()
    this.listeners.forEach(listener => listener())
  }
}
