import { useRef } from 'react'
import { useRouter } from '@/core/router'
import { composeRoute } from './composer'
import { matchRoute } from './matcher'
import { NotFoundError } from '../errors'

import type { ReactElement } from 'react'
import type { RouteManifest } from '@/core/route-builder'
import type { ComponentMap } from '../types'

/**
 * Props for the FileRouter component.
 * Defines the URL to render, the route manifest, and component map.
 */
export interface FileRouterProps {
  manifest: RouteManifest
  components: ComponentMap
}

/**
 * Router component that orchestrates route matching and composition.
 * Returns the composed route element or throws NotFoundError.
 *
 * Routes are cached on first access to avoid recomposing the same route tree.
 */
export function FileRouter({ manifest, components }: FileRouterProps): ReactElement {
  const routeCache = useRef<Record<string, ReactElement>>({})
  const { url } = useRouter()

  if (!(url in routeCache.current)) {
    const route = matchRoute(url, manifest)
    if (!route) throw new NotFoundError(url)
    routeCache.current[url] = composeRoute(route, components)
  }

  return routeCache.current[url]
}
