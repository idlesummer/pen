import { basename } from 'node:path'

type RouteModuleRole =
  typeof ROUTE_MODULE_ROLES extends Set<infer T> ? T : never

export type RouteModulePaths =
  Partial<Record<RouteModuleRole, string>>

const ROUTE_MODULE_ROLES =
  new Set(['page', 'layout', 'loading', 'error', 'default'] as const)

/** Sentinel path for the root route when no `default.tsx` exists. */
export const GLOBAL_DEFAULT = '\0default'

/** Sentinel path for the root route when no `error.tsx` exists. */
export const GLOBAL_ERROR = '\0error'

/** Which role a module path belongs to. The two sentinels carry their role
 *  in the constant itself, since they're not real files with a basename. */
export function getRouteModuleRole(fileName: string): RouteModuleRole {
  if (fileName === GLOBAL_DEFAULT) return 'default'
  if (fileName === GLOBAL_ERROR) return 'error'
  return basename(fileName, '.tsx') as RouteModuleRole
}

function isRouteFilePath(path: string): boolean {
  const fileName = basename(path)
  const routeModuleRole = getRouteModuleRole(fileName)
  return fileName.endsWith('.tsx') && ROUTE_MODULE_ROLES.has(routeModuleRole)
}

/** Narrows a file list down to real route module files (page/layout/loading/error/default). */
export function filterRouteFiles(filePaths: readonly string[]): string[] {
  return filePaths.filter(isRouteFilePath)
}
