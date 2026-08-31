import type { PropsWithChildren } from 'react'
import type { NavigationStore } from './store'
import { createContext, useState } from 'react'
import { createStore } from './store'

export const NavigationContext =
  createContext<NavigationStore | null>(null)

type NavigationProviderProps =
  PropsWithChildren<{ initialUrl?: string }>

/** Owns one navigation store for the subtree, seeded at `initialUrl` once on
 *  mount - later changes to the prop don't reseed an already-running store. */
export function NavigationProvider({ initialUrl, children }: NavigationProviderProps) {
  const [store] = useState(() => createStore(initialUrl))
  return (
    <NavigationContext value={store}>
      {children}
    </NavigationContext>
  )
}
