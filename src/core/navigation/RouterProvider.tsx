import { createContext, useState, useCallback } from 'react'
import { Router } from '@/core/router/Router'
import { type RouteManifest } from '@/core/route-builder'
import { type ComponentMap } from '@/core/router'

export interface RouterContextValue {
  currentUrl: string
  push: (url: string) => void
  replace: (url: string) => void
}

export interface RouterProviderProps {
  initialUrl: string
  manifest: RouteManifest
  components: ComponentMap
}

// Step 1: Define what data exists on the channel
const RouterContext = createContext<RouterContextValue | null>(null)

// Step 2: Broadcast the data
export function RouterProvider({ initialUrl, manifest, components }: RouterProviderProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl)
  const push = useCallback((url: string) => setCurrentUrl(url), [])
  const replace = useCallback((url: string) => setCurrentUrl(url), [])

  // This VALUE is what gets broadcast
  const value: RouterContextValue = { currentUrl, push, replace }

  return (
    <RouterContext.Provider value={value}>
      <Router url={currentUrl} manifest={manifest} components={components} />
    </RouterContext.Provider>
  )
}
