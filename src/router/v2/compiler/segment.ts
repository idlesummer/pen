import type { SegmentType } from '@/router/compiling/segment'

export type { SegmentType }

/** True if the segment consumes a url segment. */
export function isUrlConsuming(type: SegmentType): boolean {
  return type === 'static' || type === 'dynamic' || type === 'catchall'
}

/** True if the segment is dynamic or catch-all. */
export function isDynamicOrCatchall(type: SegmentType): boolean {
  return type === 'dynamic' || type === 'catchall'
}
