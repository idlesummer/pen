import type { FunctionComponent } from 'react'
import type { Module } from '@/lib/module'
import { hasDefaultExport } from '@/lib/module'

/** Each role's raw glob'd entries, keyed by path - not yet confirmed to be valid modules. */
export type ModuleRegistry = {
  page: Record<string, unknown>
  layout: Record<string, unknown>
  loading: Record<string, unknown>
  error: Record<string, unknown>
  default: Record<string, unknown>
}

/** Checks whether a value is a module with a function default export.
 *  @param value - The value to check.
 *  @returns Whether the value is a module with a function default export. */
export function isComponentModule(value: unknown): value is Module<FunctionComponent<never>> {
  return hasDefaultExport(value) && typeof value.default === 'function'
}
