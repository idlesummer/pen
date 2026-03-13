import type { ReactElement } from 'react'
import type { RoutingTable } from '../routing/composer'
import { useMemo } from 'react'
import { useRouter } from '@/pen/api'
import { createRouteResolver } from '../routing/resolver'

export type FileRouterProps = {
  routingTable: RoutingTable
}

/**
 * Router component that matches the current URL and renders the corresponding route.
 * Lazily composes route elements on first visit and caches them for subsequent renders.
 */
export function FileRouter({ routingTable }: FileRouterProps): ReactElement {
  // routingTable is static — created once from generated files, never changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const routeResolver = useMemo(() => createRouteResolver(routingTable), [])
  const { url } = useRouter()
  return routeResolver(url)
}
