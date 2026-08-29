import type { CompileDiagnostic } from '@/router'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findFiles } from '@/lib/find-files'
import { collectModulePaths, createCompiledRoutes, filterRouteFiles } from '@/router'
import { generateComponentMap } from './generate-component-map'
import { generateEntry } from './generate-entry'
import { generateRouteFiles } from './generate-route-files'

export type BuildResult = {
  diagnostics: CompileDiagnostic[]
}

/** Discovers route modules under `appDir` and emits the generated
 *  `route-files`, `component-map`, and `entry` files into `outDir`. */
export function build(appDir: string, outDir: string): BuildResult {
  const files = findFiles(appDir, '.tsx')
  const routeFiles = filterRouteFiles(files)
  const [diagnostics, routeTree] = createCompiledRoutes(routeFiles)
  const modulePaths = [...collectModulePaths(routeTree)].sort()

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'route-files.ts'), generateRouteFiles(routeFiles))
  writeFileSync(join(outDir, 'component-map.ts'), generateComponentMap({ appDir, outDir, modulePaths }))
  writeFileSync(join(outDir, 'entry.ts'), generateEntry())

  return { diagnostics }
}
