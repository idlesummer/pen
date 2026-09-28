export type RouteModuleRole =
  typeof ROUTE_MODULE_ROLES extends Set<infer T> ? T : never

export type RouteModulePaths =
  Partial<Record<RouteModuleRole, string>>

/** The shape of a route module file - generic over what its default export
 *  actually is, since that's a rendering-layer concern this package doesn't own. */
export type RouteModule<T> = { default: T }

/** Discovered modules, keyed by path, before their default exports are resolved. */
export type ModuleMap<T> = Record<string, Partial<RouteModule<T>> | undefined>

/** Resolved values, keyed by path - the two sentinel keys included. */
export type ResolvedComponents<T> = Record<string, T | undefined>

/** Resolved values bucketed by role. */
export type RoleMap<T> = Record<RouteModuleRole, Record<string, T>>

export const ROUTE_MODULE_ROLES =
  new Set(['page', 'layout', 'loading', 'error', 'default'] as const)
