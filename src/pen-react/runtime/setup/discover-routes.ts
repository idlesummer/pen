import type { RouteComponent, RouteModule } from './component-map'
import { createRouter, GLOBAL_DEFAULT, GLOBAL_ERROR } from '@/pen-core'
import { ssrGlob } from '@/lib/ssr-glob'
import { DefaultFallback } from '../renderer/components/DefaultBoundary'
import { ErrorFallback } from '../renderer/components/ErrorBoundary'
import { createDefaultExportMap } from './module-mapper'
import { validateAsyncPages, validateComponentExports } from './validate'

/**
 * Scans the app directory for route modules, compiles their paths, and
 * validates the resulting routes. Shared by `pen build` (once per build)
 * and `pen dev` (once per file add/delete) - each decides separately how
 * to report the returned diagnostics.
 *
 * @param appDir - App route directory relative to root.
 * @param root - Project root to resolve appDir against.
 */
export async function discoverRoutes(appDir: string, root: string) {
  const moduleEntries = await ssrGlob<Partial<RouteModule>>(appDir, root)
  const routeComponents = createDefaultExportMap<RouteComponent>(moduleEntries, {
    [GLOBAL_DEFAULT]: DefaultFallback,
    [GLOBAL_ERROR]: ErrorFallback,
  })

  const filePaths = moduleEntries.map(entry => entry[0])
  const { modulePaths, pageEndpoints, diagnostics } = createRouter(filePaths)

  diagnostics.push(...validateComponentExports(modulePaths, routeComponents))
  diagnostics.push(...validateAsyncPages(pageEndpoints, routeComponents))

  return { routeComponents, pageEndpoints, modulePaths, diagnostics }
}
