/** Creates an empty `Dict` without `Object.prototype` properties. */
export function dict<T>(): Record<string, T> {
  return Object.create(null)
}

/** Returns whether a `Dict` has no entries.
 *  Dicts have no prototype and are not modified through inheritance. */
export function isEmpty<T>(dict: Record<string, T>): boolean {
  for (const key in dict)
    return false
  return true
}

/** Returns the first `count` entries of a record.
 *
 *  @param record - The record to slice.
 *  @param count - The maximum number of entries to include.
 *  @returns A new record containing the first `count` entries.
 */
export function sliceRecord<T>(record: Record<string, T>, count: number): Record<string, T> {
  const newRecord: Record<string, T> = {}
  let index = 0

  for (const key in record) {
    if (index++ >= count) break
    newRecord[key] = record[key]!
  }
  return newRecord
}

/** Returns a copy of a record without the specified key.
 *  @param record - The record to omit the key from.
 *  @param key - The key to omit.
 *  @returns A shallow copy without the specified key.
 */
export function omitRecord<T extends Record<string, unknown>, K extends keyof T>(record: T, key: K): Omit<T, K> {
  const { [key]: _, ...newRecord } = record  // eslint-disable-line @typescript-eslint/no-unused-vars
  return newRecord
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
