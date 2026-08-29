import { use, useSyncExternalStore } from 'react'
import { NavigationContext } from '../NavigationProvider'

export function useNavigate() {
  const store = use(NavigationContext)
  if (!store) throw new Error('useNavigate must be used within a NavigationProvider')

  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
