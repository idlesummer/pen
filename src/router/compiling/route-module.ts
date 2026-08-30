import { basename } from 'node:path'

const ROUTE_MODULE_TYPES =
  new Set(['page', 'layout', 'loading', 'error', 'default'] as const)

/** Sentinel `default` module path assigned to the root route node when no
 *  `default.tsx` exists anywhere in the tree - never a real file path, so
 *  it can't collide with one. Codegen recognizes it and imports pen's own
 *  built-in fallback component instead of an app file. */
export const DEFAULT_FALLBACK_PATH = '\0pen:default'

export type RouteModuleType =
  typeof ROUTE_MODULE_TYPES extends Set<infer T> ? T : never

export function getRouteModuleType(fileName: string): RouteModuleType {
  return basename(fileName, '.tsx') as RouteModuleType
}

function isRouteFilePath(path: string): boolean {
  const fileName = basename(path)
  const routeModuleType = getRouteModuleType(fileName)
  return fileName.endsWith('.tsx') && ROUTE_MODULE_TYPES.has(routeModuleType)
}

/** Narrows a file list down to real route module files (page/layout/loading/error/default). */
export function filterRouteFiles(filePaths: readonly string[]): string[] {
  return filePaths.filter(isRouteFilePath)
}
