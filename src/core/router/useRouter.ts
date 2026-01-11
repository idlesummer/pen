import { useContext } from 'react'
import { RouterContext } from './RouterProvider'

// Step 3: Tune into the channel and receive the broadcast
export function useRouter() {
  const context = useContext(RouterContext)
  if (!context)
    throw new Error('useRouter must be used within a RouterProvider')
  return context
}
