/** Sentinel path for the root route when no `default.tsx` exists. */
export const GLOBAL_DEFAULT = '\0default'

/** Sentinel path for the root route when no `error.tsx` exists. */
export const GLOBAL_ERROR = '\0error'

/** Route modules names. */
export type ModuleRole = typeof MODULE_ROLES extends Set<infer T> ? T : never

/** Modules a route directory contains. */
export type ModulePaths = Partial<Record<ModuleRole, string>>

/** The shape of a route module file. */
export type Module<T> = { default: T }

/** For testing whether a base name is a route module. */
export const MODULE_ROLES = new Set(['page', 'layout', 'loading', 'error', 'default'] as const)
