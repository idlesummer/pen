import { createContext } from 'react'

export interface RouterContextValue {
  url: string
  push: (url: string) => void
  replace: (url: string) => void
}

export const RouterContext = createContext<RouterContextValue | null>(null)
