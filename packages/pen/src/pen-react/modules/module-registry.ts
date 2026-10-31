import type { ModuleRole } from '@/pen-core'

/** Raw glob entries grouped by route module role, keyed by file path. */
export type ModuleRegistry = Record<ModuleRole, Record<string, unknown>>

/** Waits on each role's already-started load and assembles the results into
 *  a ModuleRegistry. Agnostic to how a role actually gets loaded - the
 *  caller starts each promise however it needs to (a glob pattern loaded
 *  through Vite's SSR pipeline, a path list loaded through dynamic import,
 *  etc.) before handing them over here.
 *
 *  @param promises - Each role's own in-flight load. */
export async function createModuleRegistry(promises: Record<ModuleRole, Promise<ModuleRegistry[ModuleRole]>>): Promise<ModuleRegistry> {
  const [page, layout, loading, error, _default] = await Promise.all([
    promises.page,
    promises.layout,
    promises.loading,
    promises.error,
    promises.default,
  ])
  return { page, layout, loading, error, default: _default }
}
