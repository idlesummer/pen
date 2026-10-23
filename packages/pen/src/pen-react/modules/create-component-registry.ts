import type { Module, FunctionType } from '@/lib/module'
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
  page: Record<string, FunctionType>
  layout: Record<string, FunctionType>
  loading: Record<string, FunctionType>
  error: Record<string, FunctionType>
  default: Record<string, FunctionType>
}

/** Checks whether a value is a module with a function default export.
 *  @param value - The value to check.
 *  @returns Whether the value is a module with a function default export. */
export function hasFunctionDefaultExport(value: unknown): value is Module<FunctionType> {
  return hasDefaultExport(value) && typeof value.default === 'function'
}

/** Resolves a role's glob entries into components, keyed by normalized path.
 *  Drops entries that don't contain a function default export. */
function createFunctionMap(registry: Record<string, unknown>): Record<string, FunctionType> {
  const components: Record<string, FunctionType> = {}
  for (const [path, value] of Object.entries(registry)) {
    if (hasFunctionDefaultExport(value))
      components[path.replace(/^\.\//, '')] = value.default
  }
  return components
}

/** Verifies every registry entry and drops anything invalid, per role.
 *  @param registry - Raw, unconfirmed registry entries keyed by role.
 *  @returns The same role shape, with every entry confirmed to be a real component. */
export function createComponentRegistry(moduleRegistry: ModuleRegistry): ComponentRegistry {
  return {
    page: createFunctionMap(moduleRegistry.page),
    layout: createFunctionMap(moduleRegistry.layout),
    loading: createFunctionMap(moduleRegistry.loading),
    error: createFunctionMap(moduleRegistry.error),
    default: createFunctionMap(moduleRegistry.default),
  }
}
