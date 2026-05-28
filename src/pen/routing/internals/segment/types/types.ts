export type SegmentType =
  | 'static'
  | 'group'
  | 'dynamic'
  | 'catchall'

export type Segment = {
  raw: string
  type: SegmentType
  param?: string
  optional?: true
}

export type SegmentFile = {
  matches: (raw: string) => boolean
  parse: (raw: string) => Segment
  validateSelf: (segment: Segment) => Error[]
  validateChildren: (segment: Segment) => Error[]
  validateAncestors: (segment: Segment) => Error[]
}
