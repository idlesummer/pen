/** Creates an empty `Dict` without `Object.prototype` properties. */
export function dict<T>(): Record<string, T> {
  return Object.create(null)
}
