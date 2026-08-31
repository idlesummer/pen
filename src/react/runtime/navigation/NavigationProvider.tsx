import type { PropsWithChildren } from 'react'
import type { NavigationStore } from './store'
import { createContext, useState } from 'react'
import { createNavigationStore } from './store'

type NavigationProviderProps = PropsWithChildren

export const NavigationContext =
  createContext<NavigationStore | null>(null)

/** Owns one navigation store for the subtree, seeded at the root - every app
 *  starts there. createNavigationStore itself still accepts an initialUrl, for tests
 *  that want to seed a store directly without going through this provider. */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const [store] = useState(() => createNavigationStore())
  return (
    <NavigationContext value={store}>
      {children}
    </NavigationContext>
  )
}
