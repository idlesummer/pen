export type SegmentType =
  | 'static'    // "blog"        -> literal URL segment
  | 'dynamic'   // "[id]"        -> binds one URL segment
  | 'catchall'  // "[...slug]"   -> binds one-or-more, must be last
  | 'group'     // "(marketing)" -> invisible in URL, real in render tree
  | 'slot'      // "@modal"      -> parallel route pane
  | 'malformed' // anything illegal

/** True if the segment consumes a url segment. */
export function isUrlConsuming(type: SegmentType): boolean {
  return type === 'static' || type === 'dynamic' || type === 'catchall'
}

/** True if the segment is dynamic or catch-all. */
export function isDynamicOrCatchall(type: SegmentType): boolean {
  return type === 'dynamic' || type === 'catchall'
}
