// Grammar: what does a folder name mean? createSegment never throws - an
// illegal name becomes { type: 'malformed', value: '...' } instead.

// Every folder name is exactly one of these 6 types (private names are
// filtered out beforehand).
export type SegmentType =
  | 'static'    // "blog"        -> literal URL segment
  | 'dynamic'   // "[id]"        -> binds one URL segment
  | 'catchall'  // "[...slug]"   -> binds one-or-more, must be last
  | 'group'     // "(marketing)" -> invisible in URL, real in render tree
  | 'slot'      // "@modal"      -> parallel route pane
  | 'malformed' // anything illegal -> value holds why it failed

export type Segment = { type: SegmentType; value: string }

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/  // A valid JavaScript identifier - used to validate param names like "id" in "[id]"
const CATCHALL_PATTERN = /^\[\.\.\.(.+)\]$/ // [...param] - catch-all (one or more segments)
const DYNAMIC_PATTERN = /^\[(.+)\]$/        // [param] - dynamic (exactly one segment)
const GROUP_PATTERN = /^\((.+)\)$/          // (label) - route group: invisible in the URL
const STRAY_BRACKET_PATTERN = /[[\]()@]/    // A name containing stray brackets is malformed

/** Parses one folder name into a Segment. '' is the app root's own case -
 *  real in the render tree, invisible in the URL, same as any other group. */
export function createSegment(name: string): Segment {
  let match: RegExpMatchArray | null

  // '' - the app root's synthetic label (no folder name of its own to parse)
  if (!name) // if name is empty string
    return { type: 'group', value: '' }

  if ((match = name.match(CATCHALL_PATTERN)))
    return IDENT.test(match[1]!)
      ? { type: 'catchall', value: match[1]! }
      : { type: 'malformed', value: `invalid param name "${match[1]!}"` }

  if ((match = name.match(DYNAMIC_PATTERN)))
    return IDENT.test(match[1]!)
      ? { type: 'dynamic', value: match[1]! }
      : { type: 'malformed', value: `invalid param name "${match[1]!}"` }

  if ((match = name.match(GROUP_PATTERN)))
    return { type: 'group', value: match[1]! }

  // @name - named slot / parallel route
  if (name.startsWith('@'))
    return name.length > 1
      ? { type: 'slot', value: name.slice(1) }
      : { type: 'malformed', value: 'empty slot name' }

  if (STRAY_BRACKET_PATTERN.test(name))
    return { type: 'malformed', value: 'stray bracket/paren in segment name' }

  // Everything else is a plain static segment
  return { type: 'static', value: name }
}

/** True for a private folder name (`_lib`), erased from routing entirely. */
export function isPrivate(name: string): boolean {
  return name.startsWith('_')
}

/** True if the segment consumes url segments. */
export function isUrlConsuing(segment: Segment): boolean {
  const segmentType = segment.type
  return segment.type === 'static' || segmentType === 'dynamic' || segmentType === 'catchall'
}

/** True if the segment is dynamic or catch-all. */
export function isDynamicOrCatchall(segment: Segment): boolean {
  const segmentType = segment.type
  return segmentType === 'dynamic' || segmentType === 'catchall'
}
