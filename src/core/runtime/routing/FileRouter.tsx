import { useRouter } from '@/core/router'
import { composeRoute } from './composer'
import { matchRoute } from './matcher'
import { NotFoundError } from '../errors'

import type { ReactElement } from 'react'
import type { RouteManifest } from '@/core/route-builder'
import type { ComponentMap } from '../types'

/**
 * Pre-built route elements mapped by URL.
 * Built once at initialization to avoid recomposing on every navigation.
 */
export type PrebuiltRoutes = Record<string, ReactElement>

/**
 * Props for the FileRouter component.
 */
export interface FileRouterProps {
  routes: PrebuiltRoutes
}

/**
 * Builds all route elements from the manifest upfront.
 * Called once at initialization to pre-compose all routes.
 */
export function buildRoutes(manifest: RouteManifest, components: ComponentMap): PrebuiltRoutes {
  const routes: PrebuiltRoutes = {}

  for (const url in manifest) {
    const route = matchRoute(url, manifest)
    if (route) {
      routes[url] = composeRoute(route, components)
    }
  }

  return routes
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
