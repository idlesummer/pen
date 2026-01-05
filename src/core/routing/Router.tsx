import { type ReactElement } from 'react'
import { type RouteManifest } from '@/core/file-router/route-manifest'
import { composeRoute, type ComponentMap } from '@/core/routing/composer'
import { NotFoundScreen } from '@/core/routing/errors'
import { matchRoute } from '@/core/routing/matcher'

/**
 * Props for the Router component.
 * Defines the URL to render, the route manifest, and component map.
 */
export interface RouterProps {
  url: string
  manifest: RouteManifest
  components: ComponentMap
}

/**
 * Router component that orchestrates route matching and composition.
 * Returns the composed route element or 404 screen.
 */
export function Router({ url, manifest, components }: RouterProps): ReactElement {
  // Step 1: Match the route
  const route = matchRoute(url, manifest)

  // Step 2: Handle 404
  if (!route) return <NotFoundScreen url={url} />

  // Step 3: Compose and return
  return composeRoute(route, components)
}
