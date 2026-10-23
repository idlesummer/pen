/** The shape of an ES module namespace object that has a default export. */
export type Module<T = unknown> = {
  default: T
}

/** A constraint matching any function shape, for generics that need to
 *  accept a specific function type `T` as a type argument - `any` here
 *  only widens what's allowed to satisfy the bound; it never appears in
 *  a value position, so it can't leak into what callers actually get. */
export type AnyFunctionConstraint = (...args: any[]) => unknown // eslint-disable-line @typescript-eslint/no-explicit-any

/** Checks whether a value is a non-null record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Checks that a value is a module with a default export.
 *  @param value - The value to check, typically a glob'd or dynamically imported entry.
 *  @returns Whether the value is a module with a `default` property. */
function hasDefaultExport(value: unknown): value is Module {
  return isRecord(value) && 'default' in value
}

/** Checks whether a value is a module with a function default export.
 *  @param value - The value to check.
 *  @returns Whether the value is a module with a function default export. */
export function hasFunctionDefaultExport<T extends AnyFunctionConstraint>(value: unknown): value is Module<T> {
  return hasDefaultExport(value) && typeof value.default === 'function'
}
