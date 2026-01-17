import { createContext, useState, useCallback, type PropsWithChildren } from 'react'
import * as actions from './actions'
import type { NavigationHistory } from './types'

export interface RouterContextValue {
  url: string
  data: unknown | undefined
  history: readonly string[]    // Expose as readonly
  position: number              // Expose current position
  push: (url: string, data?: unknown) => void
  replace: (url: string) => void
  back: () => void
  forward: () => void
}

export interface RouterProviderProps extends PropsWithChildren {
  initialUrl: string
}

// Step 1: Define what data exists on the channel
export const RouterContext = createContext<RouterContextValue | null>(null)

// Step 2: Broadcast the data
export function RouterProvider({ initialUrl, children }: RouterProviderProps) {
  const [history, setHistory] = useState<NavigationHistory>({
    stack: [{ url: initialUrl }],
    position: 0,
  })

  // Grab the current url and data
  const { url, data } = history.stack[history.position] ?? { url: initialUrl }

  // Push new URL and data to history
  const push = useCallback((newUrl: string, newData?: unknown) => {
    setHistory(prev => actions.push(prev, newUrl, newData))
  }, [])

  // Replace current URL without adding to history
  const replace = useCallback((newUrl: string) => {
    setHistory(prev => actions.replace(prev, newUrl))
  }, [])

  // Navigate backwards
  const back = useCallback(() => {
    setHistory(prev => actions.back(prev))
  }, [])

  // Navigate forwards
  const forward = useCallback(() => {
    setHistory(prev => actions.forward(prev))
  }, [])

  return (
    <RouterContext.Provider
      value={{
        url,
        data,
        history: history.stack.map(entry => entry.url),
        position: history.position,
        push,
        replace,
        back,
        forward,
      }}
    >
      {children}
    </RouterContext.Provider>
  )
}
