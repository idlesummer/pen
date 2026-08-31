import { use } from 'react'
import { NavigationContext } from '../NavigationProvider'

/** Returns the router for the nearest NavigationProvider.
 *  The router provides access to the current navigation state and navigation actions. */
export function useRouter() {
  const store = use(NavigationContext)
  if (!store)
    throw new Error('useRouter must be used within a NavigationProvider')
  return store.actions
}
