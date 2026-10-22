// Vite's import.meta.glob is what actually builds a ModuleRegistry - it can't be
// factored into a callable function here, since the glob pattern and `base` must
// be build-time literals (confirmed empirically: Vite rejects any non-static
// value). This file only exists to hold the type, following the same "the file
// that returns a value owns its type" convention this file would otherwise use
// if a createModuleRegistry() function could exist.

import type { Module } from '@/pen-core'
import type { AnyComponent } from './create-component-map'

/** Each role's raw glob'd entries, keyed by path - not yet confirmed to be valid modules. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}

/** Checks that a glob'd registry entry really is a module with a component default export. */
export function isModule(value: unknown): value is Module<AnyComponent> {
  return typeof value === 'object' && value !== null
    && typeof (value as Partial<Module<AnyComponent>>).default === 'function'
}
