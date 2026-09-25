import { use } from 'react'
import { NavigationContext } from '../NavigationProvider'

/** Returns navigation actions - push, replace, back, forward.
 *  Doesn't subscribe to navigation state, so calling this never triggers a re-render. */
export function useRouter() {
  const store = use(NavigationContext)
  if (!store)
    throw new Error('useRouter must be used within a NavigationProvider')
  return store.actions
}
