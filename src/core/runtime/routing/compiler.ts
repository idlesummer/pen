import { composeRoute } from './composer'
import { matchRoute } from './matcher'

import type { ReactElement } from 'react'
import type { RouteManifest } from '@/core/route-builder'
import type { ComponentMap } from '../types'

/**
 * Compiled route elements mapped by URL.
 * Routes are compiled once (either at build time or runtime initialization).
 */
export type CompiledRoutes = Record<string, ReactElement>

/**
 * Compiles all route elements from the manifest.
 * Useful for testing or runtime compilation when not using codegen.
 *
 * Note: In production builds, routes are pre-compiled at build time via codegen.
 * This function exists primarily for testing and development scenarios.
 */
export function compileRoutes(manifest: RouteManifest, components: ComponentMap): CompiledRoutes {
  const routes: CompiledRoutes = {}

  for (const url in manifest) {
    const route = matchRoute(url, manifest)
    if (route) {
      routes[url] = composeRoute(route, components)
    }
  }

  return routes
}
