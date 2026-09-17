/**
 * Adds a visible indentation guide for use with JSON.stringify.
 *
 * @param value The value to stringify.
 * @returns Arguments for JSON.stringify with guided indentation.
 */
export function indent<T>(value: T): [T, null, string] {
  return [value, null, '│ ']
}
