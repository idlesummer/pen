// src/core/navigation/RouterProvider.tsx
import { createContext, useState, useCallback, type PropsWithChildren } from 'react'

/** Internal navigation history state */
interface NavigationHistory {
  stack: string[]
  index: number
}

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
  const [history, setHistory] = useState<NavigationHistory>({ stack: [initialUrl], index: 0 })
  const url = history.stack[history.index]

  // Push new URL to history
  const push = useCallback((newUrl: string) => {
    setHistory(prev => ({
      stack: [...prev.stack.slice(0, prev.index + 1), newUrl],
      index: prev.index + 1,
    }))
  }, [])

  // Replace current URL without adding to history
  const replace = useCallback((newUrl: string) => {
    setHistory(prev => {
      const newStack = [...prev.stack]
      newStack[prev.index] = newUrl
      return { ...prev, stack: newStack }
    })
  }, [])

  // Navigate backwards
  const back = useCallback(() => {
    setHistory(prev =>
      prev.index > 0
        ? { ...prev, index: prev.index - 1 }
        : prev,
      )
  }, [])

  // Navigate forwards
  const forward = useCallback(() => {
    setHistory(prev =>
      prev.index < prev.stack.length - 1
        ? { ...prev, index: prev.index + 1 }
        : prev,
    )
  }, [])

  return (
    <RouterContext.Provider value={{
      url,
      history: history.stack,  // Expose history
      index: history.index,    // Expose index
      push,
      replace,
      back,
      forward,
    }}>
      {children}
    </RouterContext.Provider>
  )
}
