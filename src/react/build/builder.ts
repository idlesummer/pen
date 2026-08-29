import type { CompileDiagnostic } from '@/router'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findFiles } from '@/lib/find-files'
import { createCompiledRoutes, getRouteModulePaths } from '@/router'
import { generateComponentMap } from './generate/component-map'
import { generateEntry } from './generate/entry'
import { generateModulePaths } from './generate/module-paths'

/** Discovers route modules under `appDir` and emits the generated
 *  `module-paths`, `component-map`, and `entry` files into `outDir`. */
export function build(appDir: string, outDir: string): CompileDiagnostic[] {
  const files = findFiles(appDir, '.tsx')
  const [diagnostics, routeTree] = createCompiledRoutes(files)
  const modulePaths = getRouteModulePaths(routeTree)

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'module-paths.ts'), generateModulePaths(modulePaths))
  writeFileSync(join(outDir, 'component-map.ts'), generateComponentMap({ appDir, outDir, modulePaths }))
  writeFileSync(join(outDir, 'entry.ts'), generateEntry())

  return diagnostics
}
