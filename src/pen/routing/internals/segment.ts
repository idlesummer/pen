export type SegmentType =
  | 'static'
  | 'group'
  | 'slot'
  | 'dynamic'
  | 'catchall'
  | 'optional-catchall'
  | 'malformed'

type SegmentData = {
  param?: string
  /** Set only when `type === 'slot'`; the parallel-route slot name (e.g. 'team'). */
  slot?: string
  /** Set only when `type === 'malformed'`; explains why parsing failed. */
  reason?: string
}

/**
 * A parsed route segment — the meaning of a single directory name.
 *
 * The data (`raw`, `type`, `param`…) and the questions you ask about it
 * (`isDynamic`, `isTransparent`…) live together here, so every "what kind of
 * segment is this?" check has exactly one home. Construction is total: see
 * `from`.
 */
export class Segment {
  readonly param?: string
  readonly slot?: string
  readonly reason?: string

  private constructor(readonly raw: string, readonly type: SegmentType, data: SegmentData = {}) {
    this.param = data.param
    this.slot = data.slot
    this.reason = data.reason
  }

  /**
   * Total parse: every input returns a `Segment`, nothing throws.
   *
   * Unparseable names (empty group/param, unbalanced brackets) classify as
   * `'malformed'` with a `reason`, so parse-layer problems join the accumulated
   * validation batch instead of short-circuiting the build.
   */
  static from(raw: string): Segment {
    // Group: (name)
    if (raw.startsWith('(') && raw.endsWith(')')) {
      const name = raw.slice(1, -1)
      return name ? new Segment(raw, 'group') : Segment.malformed(raw, 'empty group name')
    }

    // Slot: @name (parallel route — URL-transparent, like a group)
    if (raw.startsWith('@')) {
      const slot = raw.slice(1)
      return slot ? new Segment(raw, 'slot', { slot }) : Segment.malformed(raw, 'empty slot name')
    }

    // Optional catch-all: [[...name]]
    if (raw.startsWith('[[...') && raw.endsWith(']]')) {
      const param = raw.slice(5, -2)
      return param ? new Segment(raw, 'optional-catchall', { param }) : Segment.malformed(raw, 'empty param name')
    }

    // Catch-all: [...name]
    if (raw.startsWith('[...') && raw.endsWith(']')) {
      const param = raw.slice(4, -1)
      return param ? new Segment(raw, 'catchall', { param }) : Segment.malformed(raw, 'empty param name')
    }

    // Dynamic: [name]
    if (raw.startsWith('[') && raw.endsWith(']')) {
      const param = raw.slice(1, -1)
      return param ? new Segment(raw, 'dynamic', { param }) : Segment.malformed(raw, 'empty param name')
    }

    // A bracket that matched no pattern above means the name is unbalanced.
    if (raw.includes('[') || raw.includes(']'))
      return Segment.malformed(raw, 'unbalanced brackets')

    // Static: plain name
    return new Segment(raw, 'static')
  }

  private static malformed(raw: string, reason: string): Segment {
    return new Segment(raw, 'malformed', { reason })
  }

  get isStatic():    boolean { return this.type === 'static' }
  get isSlot():      boolean { return this.type === 'slot' }
  get isDynamic():   boolean { return this.type === 'dynamic' }
  get isCatchall():  boolean { return this.type === 'catchall' }
  get isOptional():  boolean { return this.type === 'optional-catchall' }
  get isMalformed(): boolean { return this.type === 'malformed' }

  /** Group or slot: contributes no URL segment — its children hoist to the parent URL. */
  get isTransparent(): boolean { return this.type === 'group' || this.type === 'slot' }
}
