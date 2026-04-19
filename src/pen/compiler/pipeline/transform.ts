import type { RouteNode } from '../builders/route-tree'
import type { RolesMapping } from './create-roles-mapping'
import type { RoutesBuckets } from './create-routes-buckets'
import { collectAppFiles } from './collect-app-files'
import { createRolesMapping } from './create-roles-mapping'
import { validateAppPaths } from './validate-app-paths'
import { createRoutesBuckets } from './create-routes-buckets'
import { buildRouteTree } from '../builders/route-tree'

export type TransformResult = {
  files: string[]
  mapping: RolesMapping
  buckets: RoutesBuckets
  routeTree: RouteNode
}

/**
 * Dev-mode pipeline: equivalent to Next.js's transform() inside the dev provider.
 *
 * In build mode, each of these is an explicit task in the tasker pipeline.
 * In dev mode, they collapse into this single call — triggered on first
 * request and re-run on every filesystem change (add/unlink).
 *
 * BUILD                        DEV
 * ─────────────────────────────────────────
 * collectFiles task            ↓
 * createMapping task           transform()
 * validatePaths task           (all inline)
 * createBuckets task           ↓
 * buildRouteTree task          ↓
 */
export function transform(appDir: string, outDir: string): TransformResult {
  const files = collectAppFiles(appDir)
  const mapping = createRolesMapping(files, appDir)
  validateAppPaths(mapping)
  const buckets = createRoutesBuckets(mapping)
  const routeTree = buildRouteTree(buckets, mapping, outDir)
  return { files, mapping, buckets, routeTree }
}
