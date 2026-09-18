import type { CompileDiagnostic } from '@/router'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findFiles } from '@/lib/find-files'
import { compile, getRouteModulePaths } from '@/router'
import { generateComponentMap } from './generate/component-map'
import { generateEntry } from './generate/entry'

/** @deprecated Built against the old router's compile() - a
 *  [diagnostics, routeTree] tuple, with modulePaths fetched separately via
 *  getRouteModulePaths(routeTree). The new compile() returns one object
 *  { positionTree, modulePaths, diagnostics } instead - needs a rewrite. */
/** Discovers route modules under `appDir` and emits the generated
 *  `component-map` and `entry` files into `outDir`. */
export function build(appDir: string, outDir: string): CompileDiagnostic[] {
  const filePaths = findFiles(appDir, '.tsx')
  const [diagnostics, routeTree] = compile(filePaths)
  const modulePaths = getRouteModulePaths(routeTree)

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'component-map.ts'), generateComponentMap({ appDir, outDir, modulePaths }))
  writeFileSync(join(outDir, 'entry.ts'), generateEntry())

  return diagnostics
}
