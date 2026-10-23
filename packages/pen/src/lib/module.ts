/** The shape of an ES module namespace object that has a default export. */
export type Module<T = unknown> = {
  default: T
}

/** Any callable value, with nothing assumed about its parameters or return
 *  type - unlike the built-in `Function`, calling it still requires narrowing
 *  first instead of silently handing back `any`. */
export type AnyFunction = (...args: unknown[]) => unknown

/** Checks whether a value is a non-null record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Checks that a value is a module with a default export.
 *  @param value - The value to check, typically a glob'd or dynamically imported entry.
 *  @returns Whether the value is a module with a `default` property. */
export function hasDefaultExport(value: unknown): value is Module {
  return isRecord(value) && 'default' in value
}
