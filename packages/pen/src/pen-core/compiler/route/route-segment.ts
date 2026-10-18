export type SegmentType =
  | 'static'    // "blog"        -> literal URL segment
  | 'dynamic'   // "[id]"        -> captures one URL segment
  | 'catchall'  // "[...slug]"   -> captures one-or-more, must be last
  | 'group'     // "(marketing)" -> invisible in URL
  | 'slot'      // "@modal"      -> parallel route pane
  | 'root'      // app/          -> root app folder
  | 'malformed' // anything illegal

type Segment = {
  type: SegmentType;
  segment: string
}

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/  // A valid JavaScript identifier used for param names like "id" in "[id]"
const CATCHALL_PATTERN = /^\[\.\.\.(.+)\]$/ // [...param] - catch-all (one or more segments)
const DYNAMIC_PATTERN = /^\[(.+)\]$/        // [param] - dynamic (exactly one segment)
const GROUP_PATTERN = /^\((.+)\)$/          // (label) - route group
const STRAY_BRACKET_PATTERN = /[[\]()@]/    // A name containing stray brackets is malformed

/** Parses a folder name into its route segment type and value.
 *
 *  The app root is represented by an empty name and receives the `root` type.
 *  Invalid route syntax receives the `malformed` type with a diagnostic value
 *  in `segment`.
 *
 *  @param name - The folder name to parse.
 *  @returns The parsed segment type and value. */
export function createSegment(name: string): Segment {
  let match: RegExpMatchArray | null

  if (!name) // if name is empty string
    return { type: 'root', segment: '' }

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

  if (name.startsWith('@')) // if slot
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

/** Checks if route is the app root or slot, both of which require a default fallback. */
export function isBoundary(type: SegmentType): boolean {
  return type === 'root' || type === 'slot'
}
