import { type ReactElement } from 'react'
import { type RouteManifest } from '@/core/route-builder'
import { useRouter } from '@/core/router'
import { composeRoute, type ComponentMap } from '../core/composer'
import { matchRoute } from '../core/matcher'
import { NotFoundError } from '../errors'

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
 * Returns the composed route element or 404 screen.
 */
export function FileRouter({ manifest, components }: FileRouterProps): ReactElement {
  const { url } = useRouter()
  const route = matchRoute(url, manifest)

  if (!route)
    throw new NotFoundError(url)
  return composeRoute(route, components)
}
