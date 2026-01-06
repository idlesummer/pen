// src/core/navigation/RouterProvider.tsx
import { createContext, useState, useCallback, type PropsWithChildren } from 'react'

export interface RouterContextValue {
  url: string
  push: (url: string) => void
  replace: (url: string) => void
  back: () => void
  forward: () => void
  canGoBack: boolean
  canGoForward: boolean
}

export interface RouterProviderProps extends PropsWithChildren {
  initialUrl: string
}

// Step 1: Define what data exists on the channel
export const RouterContext = createContext<RouterContextValue | null>(null)

// Step 2: Broadcast the data
export function RouterProvider({ initialUrl, children }: RouterProviderProps) {
  // History stack state
  const [history, setHistory] = useState<string[]>([initialUrl])
  const [index, setIndex] = useState(0)

  // Current URL is derived from history + index
  const url = history[index]

  // Computed flags
  const canGoBack = index > 0
  const canGoForward = index < history.length - 1

    // Push new URL to history
  const push = useCallback((newUrl: string) => {
    setHistory(prev => {
      // Remove any forward history (like browser behavior)
      const newHistory = prev.slice(0, index + 1)
      return [...newHistory, newUrl]
    })
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
  const back = useCallback(() => canGoBack && setIndex(prev => prev - 1), [canGoBack])

  // Navigate forwards
  const forward = useCallback(() => canGoForward && setIndex(prev => prev + 1), [canGoForward])

  return (
    <RouterContext.Provider value={{
      url,
      push,
      replace,
      back,
      forward,
      canGoBack,
      canGoForward ,
    }}>
      {children}
    </RouterContext.Provider>
  )
}
