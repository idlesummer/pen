import { use, useSyncExternalStore } from 'react'
import { NavigationContext } from '../NavigationProvider'

/** Returns the current navigation snapshot ({ history, position }).
 *  Subscribes the calling component to re-render whenever it changes. */
export function useNavigate() {
  const store = use(NavigationContext)
  if (!store)
    throw new Error('useNavigate must be used within a NavigationProvider')
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
