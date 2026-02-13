import { useRouter } from '@/pen/router'
import { NotFoundError } from './errors'

import type { ReactElement } from 'react'
import type { CompiledRoutes } from '../compiler/types'

/**
 * Props for the FileRouter component.
 */
export interface FileRouterProps {
  routes: CompiledRoutes
}

/**
 * Router component that renders compiled route elements.
 * Simply looks up the current URL in the compiled routes map.
 */
export function FileRouter({ routes }: FileRouterProps): ReactElement {
  const { url } = useRouter()
  const element = routes[url]

  if (!element) throw new NotFoundError(url)
  return element
}
