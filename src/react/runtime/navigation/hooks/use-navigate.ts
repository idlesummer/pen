import { use, useSyncExternalStore } from 'react'
import { NavigationContext } from '../NavigationProvider'

/** Returns a function for navigating to a different URL.
 *  Use this hook to programmatically navigate within the application. */
export function useNavigate() {
  const store = use(NavigationContext)
  if (!store)
    throw new Error('useNavigate must be used within a NavigationProvider')
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
