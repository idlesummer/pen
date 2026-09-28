import type { Module, ModuleRole } from './types'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { getModuleRole } from './classify'

type ModuleMap<T> = Record<string, Partial<Module<T>> | undefined>
type DefaultExports<T> = Record<string, T | undefined>
type GlobalFallbacks<T> = { default: T; error: T }
type RoleMap<T> = Record<ModuleRole, Record<string, T>>

/** Extracts each module's default export, keyed by path, and fills the two
 *  root sentinel slots with the given fallbacks when the app supplies
 *  neither. Agnostic to what T is - the fallback values are the only place
 *  that meaning enters. */
export function resolveDefaultExports<T>(modules: ModuleMap<T>, fallbacks: GlobalFallbacks<T>): DefaultExports<T> {
  const moduleExports: DefaultExports<T> = {
    [GLOBAL_DEFAULT]: fallbacks.default,
    [GLOBAL_ERROR]: fallbacks.error,
  }
  for (const [path, module] of Object.entries(modules))
    moduleExports[path] = module?.default
  return moduleExports
}

/** Buckets resolved modules by role. */
export function createRoleMap<T>(modulePaths: string[], moduleExports: DefaultExports<T>): RoleMap<T> {
  const roleMap: RoleMap<T> = {
    page: {},
    layout: {},
    loading: {},
    error: {},
    default: {},
  }
  for (const path of modulePaths) {
    const role = getModuleRole(path)
    roleMap[role][path] = moduleExports[path]! // Safe - modulePaths is a subset of resolved's keys
  }
  return roleMap
}
