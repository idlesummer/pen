import type { PropsWithChildren } from 'react'
import type { NavigationStoreAPI } from './store'
import { createContext, useState } from 'react'
import { createNavigationStore } from './store'

export const NavigationContext =
  createContext<NavigationStoreAPI | null>(null)

/** Owns one navigation store for the subtree, seeded at the root - every app
 *  starts there. createNavigationStore itself still accepts an initialUrl, for tests
 *  that want to seed a store directly without going through this provider. */
export function NavigationProvider({ children }: PropsWithChildren) {
  const [navigationStore] = useState(() => createNavigationStore('/'))
  return (
    <NavigationContext value={navigationStore}>
      {children}
    </NavigationContext>
  )
}
