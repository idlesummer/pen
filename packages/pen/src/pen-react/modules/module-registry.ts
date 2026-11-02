import { globModules, type ModuleLoader } from '@/lib/module'
import type { ModuleRole } from '@/pen-core'
import { glob } from 'node:fs/promises'

/** Raw glob entries grouped by route module role, keyed by file path. */
export type ModuleRegistry = Record<ModuleRole, Record<string, unknown>>

/** Dynamically imports each path, relative to appDir, and returns the
 *  loaded modules keyed by their path.
 *
 *  @param appDir - Directory the paths are resolved within.
 *  @param paths - File paths to import, relative to appDir.
 */
export async function loadModules(appDir: string, paths: string[]): Promise<ModuleRegistry[ModuleRole]> {
  const entries = paths.map(async path => [path, await import(/* @vite-ignore */ `/${appDir}/${path}`)] as const)
  return Object.fromEntries(await Promise.all(entries))
}

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

/** Globs each role's route files under appDir and loads them directly into
 *  a ModuleRegistry - the dev-time fused equivalent of production's static,
 *  eager `import.meta.glob` calls. Pure Node (glob + dynamic import), so
 *  unlike `ssrGlob` it needs no Vite server to run.
 *
 *  @param appDir - App route directory, resolved against the current
 *  working directory. */
export async function createModuleRegistryFromGlob(appDir: string): Promise<ModuleRegistry> {
  const loadRole = async (pattern: string) => {
    const paths = (await Array.fromAsync(glob(pattern, { cwd: appDir }))).sort()
    return loadModules(appDir, paths)
  }
  return createModuleRegistry({
    page: loadRole('**/page.tsx'),
    layout: loadRole('**/layout.tsx'),
    loading: loadRole('**/loading.tsx'),
    error: loadRole('**/error.tsx'),
    default: loadRole('**/default.tsx'),
  })
}

export async function _createModuleRegistry(appDir: string, moduleLoader: ModuleLoader): Promise<ModuleRegistry> {
  const [page, layout, loading, error, _default] = await Promise.all([
    globModules(appDir, '**/page.tsx', moduleLoader),
    globModules(appDir, '**/layout.tsx', moduleLoader),
    globModules(appDir, '**/loading.tsx', moduleLoader),
    globModules(appDir, '**/error.tsx', moduleLoader),
    globModules(appDir, '**/default.tsx', moduleLoader),
  ])
  return { page, layout, loading, error, default: _default }
}
