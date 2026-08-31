import { Navigation } from './navigation'

export type NavigationStore =
  ReturnType<typeof createNavigationStore>

/** Creates an isolated navigation store seeded at `initialUrl` - one per
 *  `NavigationProvider` instance, so multiple apps (or tests) never share history. */
export function createNavigationStore(initialUrl: string) {
  const listeners = new Set<() => void>()
  const navigation = new Navigation(initialUrl)
  let snapshot = navigation.snapshot

  const emit = () => {
    snapshot = navigation.snapshot
    listeners.forEach(fn => fn())
  }

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot:
      () => snapshot,

    actions: {
      push: (url: string, searchParams?: unknown) => {
        navigation.push(url, searchParams)
        emit()
      },
      replace: (url: string, searchParams?: unknown) => {
        navigation.replace(url, searchParams)
        emit()
      },
      back: () => {
        if (navigation.back())
          emit()
      },
      forward: () => {
        if (navigation.forward())
          emit()
      },
    },
  }
}
