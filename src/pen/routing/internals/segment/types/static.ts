import type { SegmentFile } from './types'

export const staticSegment: SegmentFile = {
  matches: () => true,
  parse: (raw) => ({ raw, type: 'static' }),
  validateSelf: ({ raw }) =>
    raw.includes('[') || raw.includes(']')
      ? [new Error(`Segment names may not start or end with extra brackets ('${raw}').`)]
      : [],
  validateChildren: () => [],
  validateAncestors: () => [],
}
