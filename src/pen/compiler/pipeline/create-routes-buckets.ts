import { parse } from 'path'
import type { SegmentRole } from '../builders/route-tree'
import type { RolesMapping } from './create-roles-mapping'
import { normalizeAppPath } from './normalize-app-path'

/**
 * Normalized URL → per-role array of raw route keys.
 *
 * Arrays mirror how Next.js's appPathsPerRoute stores multiple keys per route
 * (parallel slots, group variants). For Pen, multiple keys at the same role+URL
 * means conflicting routes — caught by validateSiblings during tree building.
 *
 * '/[...slug]' → { screen: ['/(a)/[...slug]/screen', '/(b)/[...slug]/screen'] }
 */
export type RoutesBuckets = Record<string, Partial<Record<SegmentRole, string[]>>>

/**
 * Step 4: Groups raw route keys from the mapping by their normalized URL.
 * Each bucket holds arrays of route keys per role — Pen's equivalent of
 * Next.js's appPathsPerRoute / createEntrypoints bucketing.
 *
 * {
 *   '/screen':                  '/abs/screen.tsx',
 *   '/(marketing)/blog/screen': '/abs/(marketing)/blog/screen.tsx',
 * }
 * →
 * {
 *   '/':     { screen: ['/screen'] },
 *   '/blog': { screen: ['/(marketing)/blog/screen'] },
 * }
 */
export function createRoutesBuckets(mapping: RolesMapping): RoutesBuckets {
  const buckets: RoutesBuckets = {}
  for (const routeKey of Object.keys(mapping)) {
    const url = normalizeAppPath(routeKey)
    const role = parse(routeKey).base as SegmentRole
    const bucket = (buckets[url] ??= {})
    ;(bucket[role] ??= []).push(routeKey)
  }
  return buckets
}
