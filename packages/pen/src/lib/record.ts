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

/** Picks the specified keys from a record.
 *
 *  @param record - The record to pick entries from.
 *  @param keys - The keys to include in the result.
 *  @returns A new record containing the selected entries. */
export function pickRecord<T>(record: Record<string, T>, keys: readonly string[]): Record<string, T> {
  const newRecord: typeof record = {}
  for (const key of keys)
    if (key in record)
      newRecord[key] = record[key]! // safe since key is in record
  return newRecord
}

/** Returns the first `count` entries of a record.
 *
 *  @param record - The record to slice.
 *  @param count - The maximum number of entries to include.
 *  @returns A new record containing the first `count` entries. */
export function sliceRecord<T>(record: Record<string, T>, count: number): Record<string, T> {
  const newRecord: Record<string, T> = {}
  let index = 0

  for (const key in record) {
    if (index++ >= count) break
    newRecord[key] = record[key]!
  }
  return newRecord
}
