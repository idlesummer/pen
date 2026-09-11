export type SegmentType =
  | 'static'    // "blog"        -> literal URL segment
  | 'dynamic'   // "[id]"        -> binds one URL segment
  | 'catchall'  // "[...slug]"   -> binds one-or-more, must be last
  | 'group'     // "(marketing)" -> invisible in URL, real in render tree
  | 'slot'      // "@modal"      -> parallel route pane
  | 'malformed' // anything illegal

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/  // A valid JavaScript identifier - used to validate param names like "id" in "[id]"
const CATCHALL_PATTERN = /^\[\.\.\.(.+)\]$/ // [...param] - catch-all (one or more segments)
const DYNAMIC_PATTERN = /^\[(.+)\]$/        // [param] - dynamic (exactly one segment)
const GROUP_PATTERN = /^\((.+)\)$/          // (label) - route group: invisible in the URL
const STRAY_BRACKET_PATTERN = /[[\]()@]/    // A name containing stray brackets is malformed

/** Parses one folder name into RouteNode's own type/segment fields directly -
 *  flattened here rather than nested in a Segment object, since every caller
 *  just spreads the result straight into a RouteNode. '' is the app root's
 *  own case - real in the render tree, invisible in the URL, same as any
 *  other group. */
export function createSegment(name: string): { type: SegmentType; segment: string } {
  let match: RegExpMatchArray | null

  if (!name) // if name is empty string
    return { type: 'group', segment: '' }

  if ((match = name.match(CATCHALL_PATTERN)))
    return IDENT.test(match[1]!)
      ? { type: 'catchall', segment: match[1]! }
      : { type: 'malformed', segment: `invalid param name "${match[1]!}"` }

  if ((match = name.match(DYNAMIC_PATTERN)))
    return IDENT.test(match[1]!)
      ? { type: 'dynamic', segment: match[1]! }
      : { type: 'malformed', segment: `invalid param name "${match[1]!}"` }

  if ((match = name.match(GROUP_PATTERN)))
    return { type: 'group', segment: match[1]! }

  // @name - named slot / parallel route
  if (name.startsWith('@'))
    return name.length > 1
      ? { type: 'slot', segment: name.slice(1) }
      : { type: 'malformed', segment: 'empty slot name' }

  if (STRAY_BRACKET_PATTERN.test(name))
    return { type: 'malformed', segment: 'stray bracket/paren in segment name' }

  // Everything else is a plain static segment
  return { type: 'static', segment: name }
}

/** True for a private folder name (`_lib`), erased from routing entirely. */
export function isPrivate(name: string): boolean {
  return name.startsWith('_')
}

/** True if the segment consumes a url segment. */
export function isUrlConsuming(type: SegmentType): boolean {
  return type === 'static' || type === 'dynamic' || type === 'catchall'
}

/** True if the segment is dynamic or catch-all. */
export function isDynamicOrCatchall(type: SegmentType): boolean {
  return type === 'dynamic' || type === 'catchall'
}
