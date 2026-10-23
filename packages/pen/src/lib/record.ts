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

/** Compact maps a record's entries, removing entries whose mapped values are undefined.
 *
 *  @param record - The record to map.
 *  @param mapper - Maps each value and key to a new [key, value] pair.
 *  @returns A new record built from the mapped entries. */
export function compactMapRecord<T, U>(record: Record<string, T>, mapper: (key: string, value: T) => readonly [string, U?]): Record<string, U> {
  const result: Record<string, U> = {}
  for (const [key, value] of Object.entries(record)) {
    const [newKey, newValue] = mapper(key, value)
    if (newValue !== undefined)
      result[newKey] = newValue
  }
  return result
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
