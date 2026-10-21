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
