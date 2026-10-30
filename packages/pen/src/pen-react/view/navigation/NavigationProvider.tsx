import type { PropsWithChildren } from 'react'
import type { NavigationStore } from './navigation-store'
import { createContext, use, useState } from 'react'
import { createNavigationStore } from './navigation-store'

const NavigationContext =
  createContext<NavigationStore | null>(null)

/** Connects the framework-agnostic navigation logic to React.
 *
 *  Uses useState to maintain a stable navigation store instance,
 *  and context to share it with descendants.
 */
export function NavigationProvider({ children }: PropsWithChildren) {
  const [navigationStore] = useState(() => createNavigationStore('/'))
  return (
    <NavigationContext value={navigationStore}>
      {children}
    </NavigationContext>
  )
}

/** Returns the navigation store provided by NavigationProvider.
 *  @returns The shared navigation store.
 *  @throws If used outside a NavigationProvider.
 */
export function useNavigationStore(): NavigationStore {
  const store = use(NavigationContext)
  if (!store)
    throw new Error('Navigation hooks must be used within a NavigationProvider')
  return store
}
