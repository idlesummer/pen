import type { Module } from '@/pen-core'

type ModuleEntries<T> = Array<readonly [string, Partial<Module<T>> | undefined]>
export type DefaultExportMap<T> = Record<string, T>

/**
 * Extracts each module's default export, keyed by path. A leading './' is
 * stripped from each path - callers whose source already produces bare
 * relative paths are unaffected, since there's nothing to strip.
 *
 * A module with no default export is skipped entirely rather than stored
 * as undefined - modulePaths (from createRouter) is the source of truth
 * for which paths exist, independent of this map, so skipping loses no
 * diagnosability for an invalid export.
 *
 * @param entries - Module entries containing a path and optional module.
 * @returns Default exports keyed by module path.
 */
export function createDefaultExportMap<T>(modules: ModuleEntries<T>): DefaultExportMap<T> {
  const moduleExports: DefaultExportMap<T> = {}
  for (const [path, module] of modules) {
    const component = module?.default
    if (component) moduleExports[path.replace(/^\.\//, '')] = component
  }
  return moduleExports
}
