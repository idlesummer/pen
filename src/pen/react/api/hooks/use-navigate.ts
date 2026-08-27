import { useSyncExternalStore } from 'react'
import { navigationStore } from '../store'

export function useNavigate() {
  return useSyncExternalStore(
    navigationStore.subscribe,
    navigationStore.getSnapshot,
  )
}
