import type { Route, RouteManifest } from '@/core/build/manifest'

/**
 * Matches a URL against the route manifest.
 * Returns the matched route metadata or null if no match found.
 */
export function matchRoute(url: string, manifest: RouteManifest): Route | null {
  // Normalize URL (ensure trailing slash)
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`
  
  // Direct lookup
  return manifest[normalizedUrl] ?? null
}
