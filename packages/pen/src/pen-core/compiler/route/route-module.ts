/** Sentinel path for the root route when no `default.tsx` exists. */
export const GLOBAL_DEFAULT = '\0default'

/** Sentinel path for the root route when no `error.tsx` exists. */
export const GLOBAL_ERROR = '\0error'

export type ModuleRole =
  typeof MODULE_ROLES extends Set<infer T> ? T : never

export type ModulePaths =
  Partial<Record<ModuleRole, string>>

/** The shape of a route module file - generic over what its default export
 *  actually is, since that's a rendering-layer concern this package doesn't own. */
export type Module<T> = { default: T }

export const MODULE_ROLES =
  new Set(['page', 'layout', 'loading', 'error', 'default'] as const)
