import type { FunctionComponent } from 'react'
import type { Module } from '@/lib/module'
import { compactMapRecord } from '@/lib/record'
import { hasDefaultExport } from '@/lib/module'

/** Each role's raw glob'd entries, keyed by path - generic over the entry
 *  value's type, since it's `unknown` before cleaning and a confirmed
 *  component after. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}

export type ComponentRegistry = {
  page: Record<string, FunctionComponent<never>>
  layout: Record<string, FunctionComponent<never>>
  loading: Record<string, FunctionComponent<never>>
  error: Record<string, FunctionComponent<never>>
  default: Record<string, FunctionComponent<never>>
}

/** Checks whether a value is a module with a function default export.
 *  @param value - The value to check.
 *  @returns Whether the value is a module with a function default export. */
export function isComponentModule(value: unknown): value is Module<FunctionComponent<never>> {
  return hasDefaultExport(value) && typeof value.default === 'function'
}

/** Strips the leading './' Vite's import.meta.glob puts on every key. */
function normalizeGlobPaths<T>(registry: Record<string, T>): Record<string, T> {
  return compactMapRecord(registry, (path, value) => [path.replace(/^\.\//, ''), value])
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
export function createComponentRegistry(moduleRegistry: ModuleRegistry): ComponentRegistry {
  const newModuleRegistry = {
    page: normalizeGlobPaths(moduleRegistry.page),
    layout: normalizeGlobPaths(moduleRegistry.layout),
    loading: normalizeGlobPaths(moduleRegistry.loading),
    error: normalizeGlobPaths(moduleRegistry.error),
    default: normalizeGlobPaths(moduleRegistry.default),
  }
  return {
    page: extractComponents(newModuleRegistry.page),
    layout: extractComponents(newModuleRegistry.layout),
    loading: extractComponents(newModuleRegistry.loading),
    error: extractComponents(newModuleRegistry.error),
    default: extractComponents(newModuleRegistry.default),
  }
}
