// Vite's import.meta.glob is what actually builds a ModuleRegistry - it can't be
// factored into a callable function here, since the glob pattern and `base` must
// be build-time literals (confirmed empirically: Vite rejects any non-static
// value). This file only exists to hold the type, following the same "the file
// that returns a value owns its type" convention this file would otherwise use
// if a createModuleRegistry() function could exist.

import type { FunctionComponent } from 'react'
import type { Module } from '@/pen-core'

/** Each role's raw glob'd entries, keyed by path - not yet confirmed to be valid modules. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}

/** Checks whether a value is a non-null record.
 *  @param value - The value to check.
 *  @returns Whether the value is a non-null record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Checks that a glob'd registry entry really is a module with a component default export.
 *  `never` stands in for "some component, shape unspecified" - this guard only
 *  needs to prove a callable default exists, not which role it plays. */
export function isModuleWithDefaultExport(value: unknown): value is Module<FunctionComponent<never>> {
  return isRecord(value) && typeof value.default === 'function'
}
