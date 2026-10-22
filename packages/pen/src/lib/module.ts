/** The shape of an ES module namespace object that has a default export. */
export type Module<T = unknown> = {
  default: T
}

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
