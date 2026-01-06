// src/core/navigation/RouterProvider.tsx
import { createContext, useState, useCallback, type PropsWithChildren } from 'react'

export interface RouterContextValue {
  url: string
  history: readonly string[]  // Expose as readonly
  index: number               // Expose current position
  push: (url: string) => void
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
  const [history, setHistory] = useState([initialUrl])
  const [index, setIndex] = useState(0)
  const url = history[index]

  // Push new URL to history
  const push = useCallback((newUrl: string) => {
    setHistory(prev => [...prev.slice(0, index + 1), newUrl])
    setIndex(prev => prev + 1)
  }, [index])

  // Replace current URL without adding to history
  const replace = useCallback((newUrl: string) => {
    setHistory(prev => {
      const newHistory = [...prev]
      newHistory[index] = newUrl
      return newHistory
    })
  }, [index])

  // Navigate backwards
  const back = useCallback(() => {
    if (index > 0) setIndex(prev => prev - 1)
    }, [index])

  // Navigate forwards
    const forward = useCallback(() => {
      if (index < history.length - 1) setIndex(prev => prev  +  1)
    }, [index, history.length])

  return (
    <RouterContext.Provider value={{
      url,
      history,  // Expose history
      index,    // Expose index
      push,
      replace,
      back,
      forward,
    }}>
      {children}
    </RouterContext.Provider>
  )
}
