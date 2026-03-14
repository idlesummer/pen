import type { DynamicParams } from '../providers/DynamicParamsProvider'
import { useContext } from 'react'
import { DynamicParamsContext } from '../providers/DynamicParamsProvider'

/**
 * Returns the dynamic route params for the current URL.
 *
 * @example
 * // With route file: app/users/[id]/screen.tsx
 * // and URL: /users/42/
 * const { id } = useParams() // { id: "42" }
 */
export function useParams(): DynamicParams {
  const context = useContext(DynamicParamsContext)
  return context
}
