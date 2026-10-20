/** Normalizes a value into an Error.
 *  @param value - The value to normalize.
 *  @returns The original Error or a new Error wrapping the value. */
export function normalizeError(value: unknown) {
  return Error.isError(value) ? value : new Error(`${value}`)
}
