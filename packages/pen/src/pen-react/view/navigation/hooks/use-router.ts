import type { NavigationStore } from '../navigation-store'
import { useNavigationStore } from '../NavigationProvider'

/** Returns the navigation actions.
 *  Does not subscribe the calling component to navigation state changes.
 *  @returns The navigation actions.
 */
export function useRouter(): NavigationStore['actions'] {
  const store = useNavigationStore()
  return store.actions
}
