/** Creates an empty `Dict` without `Object.prototype` properties. */
export function dict<T>(): Record<string, T> {
  return Object.create(null)
}

/** Returns a copy of a record containing only the specified keys.
 *  @param record - The record to pick keys from.
 *  @param keys - The keys to include.
 *  @returns A shallow copy containing only the specified keys.
 */
export function pickRecord<T extends Record<string, unknown>, K extends keyof T>(record: T,keys: readonly K[]): Pick<T, K> {
  const newRecord: Partial<T> = {}

  for (const key of keys)
    newRecord[key] = record[key]
  return newRecord as Pick<T, K>
}
