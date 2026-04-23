import { EmptyParamNameError } from '../errors'

export type SegmentType =
  | 'static'
  | 'group'
  | 'dynamic'
  | 'catchall'
  | 'optional-catchall'

export type Segment = {
  raw: string
  type: SegmentType
  param?: string
}

export function from(raw: string): Segment {
  if (raw.startsWith('(') && raw.endsWith(')'))
    return { raw, type: 'group' }

  if (raw.startsWith('[[...') && raw.endsWith(']]')) {
    const param = raw.slice(5, -2)
    if (!param) throw new EmptyParamNameError(raw)
    return { raw, type: 'optional-catchall', param }
  }

  if (raw.startsWith('[...') && raw.endsWith(']')) {
    const param = raw.slice(4, -1)
    if (!param) throw new EmptyParamNameError(raw)
    return { raw, type: 'catchall', param }
  }

  if (raw.startsWith('[') && raw.endsWith(']')) {
    const param = raw.slice(1, -1)
    if (!param) new EmptyParamNameError(raw)
    return { raw, type: 'dynamic', param }
  }

  return { raw, type: 'static' }
}
