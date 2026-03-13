import { useContext } from 'react'
import { ParamsContext } from '@/pen/runtime/params-context'

/**
 * Returns the dynamic route params for the current URL.
 *
 * @example
 * // With route file: app/users/[id]/screen.tsx
 * // and URL: /users/42/
 * const { id } = useParams() // { id: "42" }
 */
export function useParams(): Record<string, string> {
  return useContext(ParamsContext)
}
