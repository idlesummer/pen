import type { CompileDiagnostic, RouteNode } from '@/pen/router'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { discoverFiles } from '@/pen/lib/discover-files'
import { createRouter } from '@/pen/router'
import { generateComponentMap } from './generate-component-map'
import { generateEntry } from './generate-entry'
import { generateRouteFiles } from './generate-route-files'

export type BuildResult = {
  diagnostics: CompileDiagnostic[]
}

function collectModulePaths(routeNode: RouteNode, modulePaths = new Set<string>()): Set<string> {
  for (const path of Object.values(routeNode.modulePaths))
    modulePaths.add(path)
  for (const child of routeNode.children)
    collectModulePaths(child, modulePaths)
  return modulePaths
}

/** Discovers route modules under `appDir` and emits the generated
 *  `route-files`, `component-map`, and `entry` files into `outDir`. */
export function build(appDir: string, outDir: string): BuildResult {
  const routeFiles = discoverFiles(appDir, '.tsx')
  const [, diagnostics, routeTree] = createRouter(routeFiles)
  const modulePaths = [...collectModulePaths(routeTree)].sort()

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'route-files.ts'), generateRouteFiles(routeFiles))
  writeFileSync(join(outDir, 'component-map.ts'), generateComponentMap({ appDir, outDir, modulePaths }))
  writeFileSync(join(outDir, 'entry.ts'), generateEntry())

  return { diagnostics }
}
