import { useSyncExternalStore } from 'react'
import { navigationStore } from '../store'

export function useNavigate() {
  return useSyncExternalStore(
    cb => navigationStore.subscribe(cb),
    () => navigationStore.getSnapshot(),
  )
}
