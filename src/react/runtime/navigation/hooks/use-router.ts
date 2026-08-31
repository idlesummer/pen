import { use } from 'react'
import { NavigationContext } from '../NavigationProvider'

export function useRouter() {
  const store = use(NavigationContext)
  if (!store) throw new Error('useRouter must be used within a NavigationProvider')

  return store.actions
}
