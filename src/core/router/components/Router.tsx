import { type ReactElement } from 'react'
import { type RouteManifest } from '@/core/route-builder'
import { composeRoute, matchRoute, NotFoundScreen, type ComponentMap } from '@/core/router'
import { useRouter } from '@/core/navigation'

/**
 * Props for the Router component.
 * Defines the URL to render, the route manifest, and component map.
 */
export interface RouterProps {
  manifest: RouteManifest
  components: ComponentMap
}

/**
 * Router component that orchestrates route matching and composition.
 * Returns the composed route element or 404 screen.
 */
export function Router({ manifest, components }: RouterProps): ReactElement {
  // Step 1: Get url from provider
  const { url } = useRouter()

  // Step 2: Match the route
  const route = matchRoute(url, manifest)

  // Step 3: Handle not found
  if (!route) return <NotFoundScreen url={url} />

  // Step 4: Compose and return
  return composeRoute(route, components)
}
