import { parse } from 'path'
import type { SegmentRole } from '../builders/route-tree'
import type { RolesMapping } from './create-roles-mapping'
import { normalizeAppPath } from './normalize-app-path'

/**
 * Normalized URL → per-role raw route key.
 *
 * '/blog' → { screen: '/(marketing)/blog/screen' }
 */
export type RoutesBuckets = Record<string, Partial<Record<SegmentRole, string>>>

/**
 * Step 4: Groups raw route keys from the mapping by their normalized URL.
 * Each bucket holds the role keys for one URL — Pen's equivalent of
 * Next.js's appPathsPerRoute / createEntrypoints bucketing.
 *
 * {
 *   '/screen':                  '/abs/screen.tsx',
 *   '/(marketing)/blog/screen': '/abs/(marketing)/blog/screen.tsx',
 * }
 * →
 * {
 *   '/':     { screen: '/screen' },
 *   '/blog': { screen: '/(marketing)/blog/screen' },
 * }
 */
export function createRoutesBuckets(mapping: RolesMapping): RoutesBuckets {
  const buckets: RoutesBuckets = {}
  for (const routeKey of Object.keys(mapping)) {
    const url = normalizeAppPath(routeKey)
    const role = parse(routeKey).base as SegmentRole
    ;(buckets[url] ??= {})[role] = routeKey
  }
  return buckets
}
