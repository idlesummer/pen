import type { NavigationState } from '../navigation-core'
import { useSyncExternalStore } from 'react'
import { useNavigationStore } from '../NavigationProvider'

/** Returns the current navigation state.
 *  Subscribes the calling component to navigation changes via `useSyncExternalStore`,
 *  tracking the store's version rather than the (mutable) state itself.
 *  @returns The current navigation state.
 */
export function useNavigate(): NavigationState {
  const store = useNavigationStore()
  useSyncExternalStore(store.subscribe, store.getVersion)
  return store.getState()
}
