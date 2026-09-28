import type { Module, ModuleRole } from './types'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { getModuleRole } from './classify'

type ModuleEntries<T> = Iterable<readonly [string, Partial<Module<T>> | undefined]>
type DefaultExports<T> = Record<string, T | undefined>
type RoleMap<T> = Record<ModuleRole, Record<string, T>>

/** Extracts each module's default export, keyed by path, and fills the two
 *  root sentinel slots with the given fallbacks when the app supplies
 *  neither. Agnostic to what T is - the fallback values are the only place
 *  that meaning enters. Takes entries rather than a Record so a caller that
 *  already has entries (e.g. from mapping over Object.entries) doesn't have
 *  to round-trip through Object.fromEntries just to hand them over. */
export function resolveDefaultExports<T>(modules: ModuleEntries<T>, defaultFallback: T, errorFallback: T): DefaultExports<T> {
  const moduleExports: DefaultExports<T> = {
    [GLOBAL_DEFAULT]: defaultFallback,
    [GLOBAL_ERROR]: errorFallback,
  }
  for (const [path, module] of modules)
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
