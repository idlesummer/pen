import { Navigation } from './navigation'

function createStore() {
  const listeners = new Set<() => void>()
  const navigation = new Navigation()
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
        navigation.back()
        emit()
      },

      forward: () => {
        navigation.forward()
        emit()
      },
    },
  }
}

export const navigationStore = createStore()
