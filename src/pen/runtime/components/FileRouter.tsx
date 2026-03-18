import type { ReactElement } from 'react'
import type { RoutingTable } from '../routing/composer'
import { useMemo } from 'react'
import { usePathname } from '@/pen/api'
import { DynamicParamsProvider } from '../providers/DynamicParamsProvider'
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
  const routeResolver = useMemo(() => createRouteResolver(routingTable), [routingTable])
  const url = usePathname()
  const { element, params } = routeResolver(url)

  return (
    <DynamicParamsProvider params={params ?? {}}>
      {element}
    </DynamicParamsProvider>
  )
}
