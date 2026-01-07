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
  const { url } = useRouter()
  const route = matchRoute(url, manifest)

  return !route
    ? <NotFoundScreen url={url} />
    : composeRoute(route, components)
}
