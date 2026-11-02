import type { ModuleRole } from '@/pen-core'
import type { ModuleLoader } from '@/lib/module'
import { globModules } from '@/lib/module'

/** Raw glob entries grouped by route module role, keyed by file path. */
export type ModuleRegistry = Record<ModuleRole, Record<string, unknown>>

export async function createModuleRegistry(appDir: string, moduleLoader: ModuleLoader): Promise<ModuleRegistry> {
  const [page, layout, loading, error, _default] = await Promise.all([
    globModules(appDir, '**/page.tsx', moduleLoader),
    globModules(appDir, '**/layout.tsx', moduleLoader),
    globModules(appDir, '**/loading.tsx', moduleLoader),
    globModules(appDir, '**/error.tsx', moduleLoader),
    globModules(appDir, '**/default.tsx', moduleLoader),
  ])
  return { page, layout, loading, error, default: _default }
}
