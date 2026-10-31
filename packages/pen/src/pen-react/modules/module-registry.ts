import type { ModuleRole } from '@/pen-core'

/** Raw glob entries grouped by route module role, keyed by file path. */
export type ModuleRegistry = Record<ModuleRole, Record<string, unknown>>

/** Loads each role in parallel and assembles the result into a ModuleRegistry.
 *  Agnostic to how a single role actually gets loaded - a glob pattern loaded
 *  through Vite's SSR pipeline, a path list loaded through dynamic import, etc.
 *
 *  @param roles - Each role's own input to loader.
 *  @param loader - Loads one role's modules.
 */
export async function createModuleRegistry<T>(roles: Record<ModuleRole, T>, loader: (role: T) => Promise<Record<string, unknown>>): Promise<ModuleRegistry> {
  const [page, layout, loading, error, default_] = await Promise.all([
    loader(roles.page),
    loader(roles.layout),
    loader(roles.loading),
    loader(roles.error),
    loader(roles.default),
  ])
  return { page, layout, loading, error, default: default_ }
}
