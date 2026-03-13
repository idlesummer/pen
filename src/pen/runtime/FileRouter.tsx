import type { ReactElement } from 'react'
import type { RouteResolver } from './routing/resolver'
import { useRouter } from '@/pen/api'

export type FileRouterProps = {
  routes: RouteResolver
}

/**
 * Router component that renders compiled route elements.
 * Simply looks up the current URL in the compiled routes map.
 */
export function FileRouter({ routes }: FileRouterProps): ReactElement {
  const { url } = useRouter()
  return routes(url)
}
