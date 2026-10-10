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
      refresh: this.refreshRoute.bind(this),
    }
  }

  /* Store interface */

  /** Registers a listener and returns a function to remove it - the shape
   *  React's useSyncExternalStore expects for its subscribe argument. */
  private subscribeListeners(listener: () => void) {
    this.listeners.add(listener)
    const unsubscribe = () => this.listeners.delete(listener)
    return unsubscribe
  }

  /** Returns the cached snapshot instead of building a new one, so
   *  useSyncExternalStore sees a stable reference between emits. */
  private getNavigationSnapshot() {
    return this.snapshot
  }

  /* Navigation actions */

  /** Pushes a new history entry and notifies listeners. */
  private pushUrl(url: string, searchParams?: unknown) {
    this.navigation.push(url, searchParams)
    this.emit()
  }

  /** Replaces the current history entry and notifies listeners. */
  private replaceUrl(url: string, searchParams?: unknown) {
    this.navigation.replace(url, searchParams)
    this.emit()
  }

  /** Only notifies when history actually moved, since being at the start
   *  already makes this a no-op. */
  private goBack() {
    if (this.navigation.back())
      this.emit()
  }

  /** Only notifies when history actually moved, since being at the end
   *  already makes this a no-op. */
  private goForward() {
    if (this.navigation.forward())
      this.emit()
  }

  /** Bumps the refresh count and notifies, so the current route re-renders
   *  in place without changing history. */
  private refreshRoute() {
    this.navigation.refresh()
    this.emit()
  }

  /* Internal helpers */

  /** Refreshes the cached snapshot, then notifies every subscribed listener. */
  private emit() {
    this.snapshot = this.navigation.getSnapshot()
    this.listeners.forEach(listener => listener())
  }
}
