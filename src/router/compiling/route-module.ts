import { basename } from 'node:path'

export type RouteModuleType =
  typeof ROUTE_MODULE_TYPES extends Set<infer T> ? T : never

const ROUTE_MODULE_TYPES =
  new Set(['page', 'layout', 'loading', 'error', 'default'] as const)

/** Sentinel path for the root route when no `default.tsx` exists. */
export const DEFAULT_FALLBACK_PATH = '\0default'

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
