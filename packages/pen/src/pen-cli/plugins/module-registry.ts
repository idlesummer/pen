import type { ViteDevServer } from 'vite'
import type { ModuleRegistry } from '@/pen-react/modules'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { createModuleRegistry } from '@/pen-react/modules'
import { ssrGlob } from '@/lib/ssr-glob'

/** Loads each role's route modules, mirroring production's per-role
 *  `import.meta.glob` calls, but through Vite's dev-time SSR pipeline so the
 *  result reflects whichever route files exist right now. Used by
 *  `pen:diagnose` (build) and `pen:dev` (dev) for their own initial route
 *  validation - neither has anything else loaded yet to check against.
 *
 *  @param projectDir - Project directory containing the app directory.
 *  @param routesDir - App route directory relative to the project directory.
 *  @param server - Dev server to load route modules through.
 *  @returns The loaded registry, or undefined if the routes directory doesn't exist. */
export async function loadModuleRegistry(projectDir: string, routesDir: string, server: ViteDevServer): Promise<ModuleRegistry | undefined> {
  if (!existsSync(join(projectDir, routesDir)))
    return

  return createModuleRegistry(
    {
      page: '**/page.tsx',
      layout: '**/layout.tsx',
      loading: '**/loading.tsx',
      error: '**/error.tsx',
      default: '**/default.tsx',
    },
    pattern => ssrGlob(pattern, {
      base: routesDir,
      server,
    }),
  )
}
