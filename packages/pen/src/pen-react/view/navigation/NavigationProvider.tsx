import type { PropsWithChildren } from 'react'
import type { NavigationStore } from './navigation-store'
import { createContext, useState } from 'react'
import { createNavigationStore } from './navigation-store'

export const NavigationContext =
  createContext<NavigationStore | null>(null)

/** Owns one navigation store for the subtree, starting at the root route. */
export function NavigationProvider({ children }: PropsWithChildren) {
  const [navigationStore] = useState(() => createNavigationStore('/'))
  return (
    <NavigationContext value={navigationStore}>
      {children}
    </NavigationContext>
  )
}
