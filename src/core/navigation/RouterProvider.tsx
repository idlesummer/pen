import { createContext, useState, useCallback, type PropsWithChildren } from 'react'

export interface RouterContextValue {
  url: string
  push: (url: string) => void
  replace: (url: string) => void
}

export interface RouterProviderProps extends PropsWithChildren {
  initialUrl: string
}

// Step 1: Define what data exists on the channel
const RouterContext = createContext<RouterContextValue | null>(null)

// Step 2: Broadcast the data
export function RouterProvider({ initialUrl, children }: RouterProviderProps) {
  const [url, setUrl] = useState(initialUrl)
  const push = useCallback((u: string) => setUrl(u), [])
  const replace = useCallback((u: string) => setUrl(u), [])

  return (
    <RouterContext.Provider value={{ url, push, replace }}>
      {children}
    </RouterContext.Provider>
  )
}
