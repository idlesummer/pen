import type { Module, ModuleRole } from './types'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { getModuleRole } from './classify'

type ModuleMap<T> = Record<string, Partial<Module<T>> | undefined>
type ModuleExports<T> = Record<string, T | undefined>
type RoleMap<T> = Record<ModuleRole, Record<string, T>>

/** Extracts each module's default export, keyed by path, and fills the two
 *  root sentinel slots with the given fallbacks when the app supplies
 *  neither. Agnostic to what T is - the fallback values are the only place
 *  that meaning enters. */
export function createModuleExports<T>(modules: ModuleMap<T>, fallbacks: { default: T, error: T }): ModuleExports<T> {
  const moduleExports: ModuleExports<T> = {}
  for (const [path, module] of Object.entries(modules))
    moduleExports[path] = module?.default

  moduleExports[GLOBAL_DEFAULT] = fallbacks.default
  moduleExports[GLOBAL_ERROR] = fallbacks.error
  return moduleExports
}

/** Buckets resolved modules by role. */
export function createRoleMap<T>(modulePaths: string[], moduleExports: ModuleExports<T>): RoleMap<T> {
  const roleMap: RoleMap<T> = { page: {}, layout: {}, loading: {}, error: {}, default: {} }
  for (const path of modulePaths) {
    const role = getModuleRole(path)
    roleMap[role][path] = moduleExports[path]! // Safe - modulePaths is a subset of resolved's keys
  }
  return roleMap
}
