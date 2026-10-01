import type { Module } from './types'

type ModuleEntries<T> = Array<readonly [string, Partial<Module<T>> | undefined]>
type DefaultExportMap<T> = Record<string, T | undefined>

/**
 * Extracts each module's default export, keyed by path. A leading './' is
 * stripped from each path - callers whose source already produces bare
 * relative paths are unaffected, since there's nothing to strip.
 *
 * Callers that need the root default/error sentinels (GLOBAL_DEFAULT/
 * GLOBAL_ERROR) populated add those entries themselves - not every caller
 * wants both, so injecting them here would force irrelevant entries onto
 * callers that only handle one role.
 *
 * @param entries - Module entries containing a path and optional module.
 * @returns Default exports keyed by module path.
 */
export function createDefaultExportMap<T>(modules: ModuleEntries<T>): DefaultExportMap<T> {
  const moduleExports: DefaultExportMap<T> = {}
  for (const [path, module] of modules)
    moduleExports[path.replace(/^\.\//, '')] = module?.default
  return moduleExports
}
