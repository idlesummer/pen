import type { RouteModuleRole } from './types'
import { basename } from 'node:path'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { ROUTE_MODULE_ROLES } from './types'

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
