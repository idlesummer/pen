import type { RouteNode, RouteManifest } from '@/core/route-builder'

/**
 * Matches a URL against the route manifest.
 * Returns the matched route metadata or null if no match found.
 */
export function matchRoute(url: string, manifest: RouteManifest): RouteNode | null {
  // Normalize URL (ensure trailing slash)
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`

  // Direct lookup
  return manifest[normalizedUrl] ?? null
}
