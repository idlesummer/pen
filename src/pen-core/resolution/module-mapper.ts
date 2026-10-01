import type { Module } from './types'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './sentinel'

type ModuleEntries<T> = Array<readonly [string, Partial<Module<T>> | undefined]>
type DefaultExportMap<T> = Record<string, T | undefined>
type Fallbacks<T> = Partial<Record<typeof GLOBAL_DEFAULT | typeof GLOBAL_ERROR, T>>

/**
 * Extracts each module's default export, keyed by path, optionally seeded
 * with the root default/error sentinel fallbacks. A leading './' is
 * stripped from each path - callers whose source already produces bare
 * relative paths are unaffected, since there's nothing to strip.
 *
 * `fallbacks` is optional and takes either sentinel, both, or neither -
 * not every caller wants both (a role-specific map only ever needs its
 * own sentinel, if any), so forcing both here would plant irrelevant
 * entries on callers that only handle one role.
 *
 * @param entries - Module entries containing a path and optional module.
 * @param fallbacks - Sentinel fallbacks to seed the map with, if any.
 * @returns Default exports keyed by module path.
 */
export function createDefaultExportMap<T>(modules: ModuleEntries<T>, fallbacks?: Fallbacks<T>): DefaultExportMap<T> {
  const moduleExports: DefaultExportMap<T> = { ...fallbacks }
  for (const [path, module] of modules)
    moduleExports[path.replace(/^\.\//, '')] = module?.default
  return moduleExports
}
