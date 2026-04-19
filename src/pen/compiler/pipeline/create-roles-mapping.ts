import { join, parse } from 'path'
import { SEGMENT_ROLES } from '../builders/route-tree'
import type { SegmentRole } from '../builders/route-tree'

/**
 * Route key (groups preserved, no extension) → absolute path.
 *
 * '/(marketing)/blog/screen' → '/abs/(marketing)/blog/screen.tsx'
 */
export type RolesMapping = Record<string, string>

/**
 * Step 2: Filters collected files to role files only (layout, screen, error, not-found)
 * and maps each to a route key with route groups preserved, extension stripped.
 *
 * Equivalent to Next.js's createPagesMapping.
 *
 * ['screen.tsx', '(marketing)/blog/screen.tsx']
 * →
 * {
 *   '/screen':                  '/abs/screen.tsx',
 *   '/(marketing)/blog/screen': '/abs/(marketing)/blog/screen.tsx',
 * }
 */
export function createRolesMapping(files: string[], appDir: string): RolesMapping {
  const mapping: RolesMapping = {}
  for (const file of files) {
    const { name, dir } = parse(file)
    if (!SEGMENT_ROLES.includes(name as SegmentRole)) continue
    const routeKey = dir ? `/${dir}/${name}` : `/${name}`
    mapping[routeKey] = join(appDir, file)
  }
  return mapping
}
