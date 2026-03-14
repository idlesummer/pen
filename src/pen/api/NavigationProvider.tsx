import type { PropsWithChildren } from 'react'
import { createContext, useReducer } from 'react'
import { createNavigationState, reducer } from './reducer'

export const NavigationContext = createContext<NavigationContextValue | null>(null)
export type NavigationContextValue = {
  url: string
  searchParams?: unknown
  history: readonly string[]    // Expose as readonly
  position: number              // Expose current position
  push: (url: string, searchParams?: unknown) => void
  replace: (url: string) => void
  back: () => void
  forward: () => void
}

export type NavigationProviderProps = PropsWithChildren<{ initialUrl: string }>
export function NavigationProvider({ initialUrl, children }: NavigationProviderProps) {
  const [navigation, dispatch] = useReducer(reducer, initialUrl, createNavigationState)
  const { url, searchParams } = navigation.history[navigation.position]!

  return (
    <NavigationContext.Provider
      value={{
        url, searchParams,
        history: navigation.history.map(location => location.url),
        position: navigation.position,
        push:    (url, searchParams) => dispatch({ type: 'push', url, searchParams }),
        replace: (url) => dispatch({ type: 'replace', url }),
        back:    ()    => dispatch({ type: 'back' }),
        forward: ()    => dispatch({ type: 'forward' }),
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}
