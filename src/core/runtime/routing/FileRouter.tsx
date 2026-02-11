import type { ReactElement } from 'react'
import { useRouter } from '@/core/router'
import { NotFoundError } from '../errors'

/**
 * Pre-built route elements mapped by URL.
 * Built once at initialization to avoid recomposing on every navigation.
 */
export type CompiledRoutes = Record<string, ReactElement>

/** Props for the FileRouter component. */
export interface FileRouterProps {
  routes: CompiledRoutes
}

/**
 * Router component that renders pre-built route elements.
 * Simply looks up the current URL in the pre-built routes map.
 */
export function FileRouter({ routes }: FileRouterProps): ReactElement {
  const { url } = useRouter()
  const element = routes[url]

  if (!element) throw new NotFoundError(url)
  return element
}
