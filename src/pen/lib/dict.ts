/** A string-keyed lookup object without `Object.prototype` properties. */
export type Dict<T> = Record<string, T>

/** Creates an empty `Dict` without `Object.prototype` properties. */
export function dict<T>(): Dict<T> {
  return Object.create(null)
}
