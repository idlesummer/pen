import { Navigation } from './navigation'

/** Wraps `Navigation` and adds what it has none of: a `listeners` Set,
 *  `subscribe`/`getSnapshot`, and actions that mutate then notify. Public
 *  methods are arrow fields, not regular ones - React and consumers detach
 *  them from `this` (`useSyncExternalStore(store.subscribe, store.getSnapshot)`,
 *  `const { push } = useRouter()`), so they can't rely on a receiver. */
class NavigationStore {
  private listeners = new Set<() => void>()
  private navigation: Navigation
  private snapshot: Navigation['snapshot']

  constructor(initialUrl: string) {
    this.navigation = new Navigation(initialUrl)
    this.snapshot = this.navigation.snapshot
  }

  private emit() {
    this.snapshot = this.navigation.snapshot
    this.listeners.forEach(fn => fn())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
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

export type NavigationStoreAPI =
  ReturnType<typeof createNavigationStore>

/** Creates an isolated navigation store seeded at `initialUrl` - one per
 *  `NavigationProvider` instance, so multiple apps (or tests) never share history. */
export function createNavigationStore(initialUrl: string) {
  const store = new NavigationStore(initialUrl)
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
