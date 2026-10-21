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

/** Maps a record's values, omitting entries mapped to undefined.
 *
 *  @param record - The record to map.
 *  @param mapper - Maps each value and key to a new value or undefined.
 *  @returns A new record containing the mapped values. */
export function compactMapRecord<T, U>(record: Record<string, T>, mapper: (value: T, key: string) => U | undefined): Record<string, U> {
  const result: Record<string, U> = {}
  for (const [key, value] of Object.entries(record)) {
    const mapped = mapper(value, key)
    if (mapped !== undefined)
      result[key] = mapped
  }
  return result
}

/** Maps a record's entries, omitting entries mapped to undefined.
 *  Unlike {@link compactMapRecord}, the mapper can also rewrite the key.
 *
 *  @param record - The record to map.
 *  @param mapper - Maps each value and key to a new [key, value] pair, or undefined.
 *  @returns A new record built from the mapped entries. */
export function compactMapEntries<T, U>(record: Record<string, T>, mapper: (value: T, key: string) => readonly [string, U] | undefined): Record<string, U> {
  const result: Record<string, U> = {}
  for (const [key, value] of Object.entries(record)) {
    const entry = mapper(value, key)
    if (entry !== undefined)
      result[entry[0]] = entry[1]
  }
  return result
}
