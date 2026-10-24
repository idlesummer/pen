import type { ComponentMatcher } from './component-matcher'

/** Stateful store around the current {@link ComponentMatcher}, so it can be
 *  swapped from outside React (dev-time live reload) through React's own
 *  update scheduling instead of Ink's `render()` API.
 *  The class owns its store state, while bound fields form the public
 *  interface so consumers can pass them directly without invoking or
 *  binding methods. */
export class ComponentMatcherStore {
  private listeners
  private matcher

  /** @param listener - Called after the matcher is swapped.
   *  @returns A function that unsubscribes the listener. */
  readonly subscribe
  /** @returns The current component matcher. */
  readonly getSnapshot
  /** Swaps in a new matcher and notifies subscribers. */
  readonly update

  constructor(matcher: ComponentMatcher) {
    this.listeners = new Set<() => void>()
    this.matcher = matcher

    this.subscribe = this.subscribeListeners.bind(this)
    this.getSnapshot = this.getMatcherSnapshot.bind(this)
    this.update = this.updateMatcher.bind(this)
  }

  /* Store interface */

  /** Matches the subscribe shape useSyncExternalStore expects. */
  private subscribeListeners(listener: () => void) {
    this.listeners.add(listener)
    const unsubscribe = () => this.listeners.delete(listener)
    return unsubscribe
  }

  /** Cached, so the reference stays stable between emits. */
  private getMatcherSnapshot() {
    return this.matcher
  }

  /* Matcher actions */

  /** Swaps the matcher and notifies. */
  private updateMatcher(matcher: ComponentMatcher) {
    this.matcher = matcher
    this.listeners.forEach(listener => listener())
  }
}
