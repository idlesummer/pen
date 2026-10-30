import type { PropsWithChildren } from 'react'
import type { NavigationState } from './navigation-core'
import type { NavigationStore } from './navigation-store'
import { createContext, use, useState, useSyncExternalStore } from 'react'
import { createNavigationStore } from './navigation-store'

// ── context ──────────────────────────────────────────────────────────────

const NavigationContext =
  createContext<NavigationStore | null>(null)

/** Connects the framework-agnostic navigation logic to React.
 *
 *  Uses useState to maintain a stable navigation store instance,
 *  context to share it with descendants, and useSyncExternalStore
 *  to synchronize component updates with navigation changes.
 */
export function NavigationProvider({ children }: PropsWithChildren) {
  const [navigationStore] = useState(() => createNavigationStore('/'))
  return (
    <NavigationContext value={navigationStore}>
      {children}
    </NavigationContext>
  )
}

// ── hooks ────────────────────────────────────────────────────────────────

/** Returns the navigation store provided by NavigationProvider.
 *  @returns The shared navigation store.
 *  @throws If used outside a NavigationProvider.
 */
function useNavigationStore(): NavigationStore {
  const store = use(NavigationContext)
  if (!store)
    throw new Error('useNavigate must be used within a NavigationProvider')
  return store
}

/** Returns the current navigation state.
 *  Subscribes the calling component to navigation changes via `useSyncExternalStore`.
 *  @returns The current navigation state.
 */
export function useNavigate(): NavigationState {
  const store = useNavigationStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}

/** Returns the navigation actions.
 *  Does not subscribe the calling component to navigation state changes.
 *  @returns The navigation actions.
 */
export function useRouter(): NavigationStore['actions'] {
  const store = useNavigationStore()
  return store.actions
}
