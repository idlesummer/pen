export type SegmentType =
  | 'static'
  | 'group'
  | 'slot'
  | 'dynamic'
  | 'catchall'
  | 'optional-catchall'
  | 'malformed'

export type Segment = {
  raw: string
  type: SegmentType
  param?: string
  optional?: true
  /** Set only when `type === 'slot'`; the parallel-route slot name (e.g. 'team'). */
  slot?: string
  /** Set only when `type === 'malformed'`; explains why parsing failed. */
  reason?: string
}

/**
 * Total parse: every input returns a `Segment`, nothing throws.
 *
 * Unparseable names (empty group/param, unbalanced brackets) classify as
 * `'malformed'` with a `reason`, so parse-layer problems join the accumulated
 * validation batch instead of short-circuiting the build.
 */
export function from(raw: string): Segment {
  // Group: (name)
  if (raw.startsWith('(') && raw.endsWith(')'))
    return raw.slice(1, -1)
      ? { raw, type: 'group' }
      : { raw, type: 'malformed', reason: 'empty group name' }

  // Slot: @name (parallel route — URL-transparent, like a group)
  if (raw.startsWith('@'))
    return raw.length > 1
      ? { raw, type: 'slot', slot: raw.slice(1) }
      : { raw, type: 'malformed', reason: 'empty slot name' }

  // Optional catch-all: [[...name]]
  if (raw.startsWith('[[...') && raw.endsWith(']]')) {
    const param = raw.slice(5, -2)
    return param
      ? { raw, type: 'optional-catchall', param, optional: true }
      : { raw, type: 'malformed', reason: 'empty param name' }
  }

  // Catch-all: [...name]
  if (raw.startsWith('[...') && raw.endsWith(']')) {
    const param = raw.slice(4, -1)
    return param
      ? { raw, type: 'catchall', param }
      : { raw, type: 'malformed', reason: 'empty param name' }
  }

  // Dynamic: [name]
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const param = raw.slice(1, -1)
    return param
      ? { raw, type: 'dynamic', param }
      : { raw, type: 'malformed', reason: 'empty param name' }
  }

  // A bracket that matched no pattern above means the name is unbalanced.
  if (raw.includes('[') || raw.includes(']'))
    return { raw, type: 'malformed', reason: 'unbalanced brackets' }

  // Static: plain name
  return { raw, type: 'static' }
}
