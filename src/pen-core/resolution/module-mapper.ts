import type { Module, ModuleRole } from './types'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { getModuleRole } from './classify'

type ModuleEntries<T> = Array<readonly [string, Partial<Module<T>> | undefined]>
type DefaultExportMap<T> = Record<string, T | undefined>
type RoleMap<T> = Record<ModuleRole, Record<string, T>>

/**
 * Extracts each module's default export, keyed by path, and fills the root
 * default and error entries with the given fallbacks. A leading './' is
 * stripped from each path - callers whose source already produces bare
 * relative paths are unaffected, since there's nothing to strip.
 *
 * @param entries - Module entries containing a path and optional module.
 * @param defaultFallback - Fallback for the root default entry.
 * @param errorFallback - Fallback for the root error entry.
 * @returns Default exports keyed by module path.
 */
export function createDefaultExportMap<T>(modules: ModuleEntries<T>, defaultFallback: T, errorFallback: T): DefaultExportMap<T> {
  const moduleExports: DefaultExportMap<T> = {
    [GLOBAL_DEFAULT]: defaultFallback,
    [GLOBAL_ERROR]: errorFallback,
  }
  for (const [path, module] of modules)
    moduleExports[path.replace(/^\.\//, '')] = module?.default
  return moduleExports
}

/**
 * Buckets resolved module exports by their route role.
 *
 * Untyped rather than generic over T - every bucket here shares one type,
 * but each role actually has its own distinct component shape (a page
 * isn't a layout isn't an error boundary). Resolving that only happens at
 * the call site, which knows the real per-role types and asserts them;
 * no instantiation of T could express that here, so the type parameter
 * was never doing real work.
 *
 * @param modulePaths - Paths of the modules to include.
 * @param moduleExports - Resolved module exports keyed by path.
 * @returns Module exports grouped by route role and path.
 */
export function createRoleMap(modulePaths: string[], moduleExports: DefaultExportMap<unknown>): RoleMap<unknown> {
  const roleMap: RoleMap<unknown> = {
    page: {},
    layout: {},
    loading: {},
    error: {},
    default: {},
  }
  for (const path of modulePaths) {
    const role = getModuleRole(path)
    roleMap[role][path] = moduleExports[path] // Safe - modulePaths is a subset of resolved's keys
  }
  return roleMap
}
