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
