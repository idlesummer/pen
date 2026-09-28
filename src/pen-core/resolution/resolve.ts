import type { RouteModule, RouteModuleRole } from './types'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'
import { getRouteModuleRole } from './classify'

type ModuleMap<T> = Record<string, Partial<RouteModule<T>> | undefined>
type ResolvedComponents<T> = Record<string, T | undefined>
type RoleMap<T> = Record<RouteModuleRole, Record<string, T>>

/** Extracts each module's default export, keyed by path, and fills the two
 *  root sentinel slots with the given fallbacks when the app supplies
 *  neither. Agnostic to what T is - the fallback values are the only place
 *  that meaning enters. */
export function resolveRouteModules<T>(modules: ModuleMap<T>, fallbacks: { default: T, error: T }): ResolvedComponents<T> {
  const resolved: ResolvedComponents<T> = {}
  for (const [path, module] of Object.entries(modules))
    resolved[path] = module?.default

  resolved[GLOBAL_DEFAULT] = fallbacks.default
  resolved[GLOBAL_ERROR] = fallbacks.error
  return resolved
}

/** Buckets resolved modules by role. */
export function bucketByRole<T>(modulePaths: string[], resolved: ResolvedComponents<T>): RoleMap<T> {
  const buckets = { page: {}, layout: {}, loading: {}, error: {}, default: {} } as RoleMap<T>
  for (const path of modulePaths)
    buckets[getRouteModuleRole(path)][path] = resolved[path]! // Safe - modulePaths is a subset of resolved's keys

  return buckets
}
