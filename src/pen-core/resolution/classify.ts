import type { ModuleRole } from './types'
import { basename } from 'node:path'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { MODULE_ROLES } from './types'

/** Which role a module path belongs to. The two sentinels carry their role
 *  in the constant itself, since they're not real files with a basename. */
export function getModuleRole(fileName: string): ModuleRole {
  if (fileName === GLOBAL_DEFAULT) return 'default'
  if (fileName === GLOBAL_ERROR) return 'error'
  return basename(fileName, '.tsx') as ModuleRole
}

function isModuleFilePath(path: string): boolean {
  const fileName = basename(path)
  const moduleRole = getModuleRole(fileName)
  return fileName.endsWith('.tsx') && MODULE_ROLES.has(moduleRole)
}

/** Narrows a file list down to real route module files (page/layout/loading/error/default). */
export function filterModuleFiles(filePaths: readonly string[]): string[] {
  return filePaths.filter(isModuleFilePath)
}
