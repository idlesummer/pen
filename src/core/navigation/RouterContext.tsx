// import { createContext } from 'react'

// export interface RouterContextValue {
//   currentUrl: string
//   push: (url: string) => void
//   replace: (url: string) => void
//   back: () => void
//   forward: () => void
//   canGoBack: boolean
//   canGoForward: boolean
// }

// export const RouterContext = createContext<RouterContextValue | null>(null)

// core/navigation/RouterContext.tsx
import { createContext } from 'react'

export interface RouterContextValue {
  currentUrl: string
  push: (url: string) => void
  replace: (url: string) => void
}

export const RouterContext = createContext<RouterContextValue | null>(null)
