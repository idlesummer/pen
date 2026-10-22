import type { FunctionComponent } from 'react'
import type { Module } from '@/lib/module'
import { hasDefaultExport } from '@/lib/module'

/** Each role's raw glob'd entries, keyed by path - generic over the entry
 *  value's type, since it's `unknown` before cleaning and a confirmed
 *  component after. */
export type ModuleRegistry<T = unknown> = {
  page: Record<string, T>
  layout: Record<string, T>
  loading: Record<string, T>
  error: Record<string, T>
  default: Record<string, T>
}

/** Checks whether a value is a module with a function default export.
 *  @param value - The value to check.
 *  @returns Whether the value is a module with a function default export. */
export function isComponentModule(value: unknown): value is Module<FunctionComponent<never>> {
  return hasDefaultExport(value) && typeof value.default === 'function'
}

/** Resolves one role's registry entries into real components, keyed by path.
 *  Drops any entry that doesn't pass the module guard. */
function extractComponents(registry: Record<string, unknown>): Record<string, FunctionComponent<never>> {
  const components: Record<string, FunctionComponent<never>> = {}
  for (const [path, value] of Object.entries(registry)) {
    if (isComponentModule(value))
      components[path] = value.default
  }
  return components
}

/** Verifies every registry entry and drops anything invalid, per role.
 *  @param registry - Raw, unconfirmed registry entries keyed by role.
 *  @returns The same role shape, with every entry confirmed to be a real component. */
export function cleanModuleRegistry(registry: ModuleRegistry): ModuleRegistry<FunctionComponent<never>> {
  return {
    page: extractComponents(registry.page),
    layout: extractComponents(registry.layout),
    loading: extractComponents(registry.loading),
    error: extractComponents(registry.error),
    default: extractComponents(registry.default),
  }
}
