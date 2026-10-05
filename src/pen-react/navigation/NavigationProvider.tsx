import type { PropsWithChildren } from 'react'
import { createContext, useState } from 'react'
import { NavigationStore } from './navigation-store'

export const NavigationContext =
  createContext<NavigationStore | null>(null)

/** Owns one navigation store for the subtree, starting at the root URL. */
export function NavigationProvider({ children }: PropsWithChildren) {
  const [navigationStore] = useState(() => new NavigationStore('/'))
  return (
    <NavigationContext value={navigationStore}>
      {children}
    </NavigationContext>
  )
}
