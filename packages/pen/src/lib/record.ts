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

/** Compact maps a record's entries, removing entries mapped to undefined.
 *
 *  @param record - The record to map.
 *  @param mapper - Maps each value and key to a new [key, value] pair, or undefined.
 *  @returns A new record built from the mapped entries. */
export function compactMap<T, U>(record: Record<string, T>, mapper: (value: T, key: string) => readonly [string, U?]): Record<string, U> {
  const result: Record<string, U> = {}
  for (const [key, value] of Object.entries(record)) {
    const [newKey, newValue] = mapper(value, key)
    if (newValue !== undefined)
      result[newKey] = newValue
  }
  return result
}
