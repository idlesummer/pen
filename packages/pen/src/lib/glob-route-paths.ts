import { globSync } from 'node:fs'
import { join } from 'node:path'

/** Each role's route file paths, relative to the app directory. */
export type RoutePaths = {
  page: string[]
  layout: string[]
  loading: string[]
  error: string[]
  default: string[]
}

/** Lists each role's currently-matching route file paths, without loading
 *  them - just a fresh-off-disk directory scan.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory. */
export function globRoutePaths(projectDir: string, routesDir: string): RoutePaths {
  const cwd = join(projectDir, routesDir)
  const glob = (pattern: string) => globSync(pattern, { cwd }).sort()
  return {
    page: glob('**/page.tsx'),
    layout: glob('**/layout.tsx'),
    loading: glob('**/loading.tsx'),
    error: glob('**/error.tsx'),
    default: glob('**/default.tsx'),
  }
}
