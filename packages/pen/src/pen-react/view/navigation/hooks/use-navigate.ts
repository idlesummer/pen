import type { NavigationState } from '../navigation-core'
import { useSyncExternalStore } from 'react'
import { useNavigationStore } from '../NavigationProvider'

/** Returns the current navigation state.
 *  Subscribes the calling component to navigation changes via `useSyncExternalStore`.
 *  @returns The current navigation state.
 */
export function useNavigate(): NavigationState {
  const store = useNavigationStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}
