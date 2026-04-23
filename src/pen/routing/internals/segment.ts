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

export type ParseResult = {
  segment: Segment
  errors: Error[]
}

export function from(raw: string): ParseResult {
  const errors: Error[] = []

  if (raw.includes('…'))
    errors.push(new Error(`Detected a three-dot character ('…') at ('${raw}'). Did you mean ('...')?`))

  if (raw.startsWith('(') && raw.endsWith(')'))
    return { segment: { raw, type: 'group' }, errors }

  if (!raw.includes('[') && !raw.includes(']'))
    return { segment: { raw, type: 'static' }, errors }

  if (raw.startsWith('[[...') && raw.endsWith(']]')) {
    const param = raw.slice(5, -2)
    validateParam(param, raw, errors)
    return { segment: { raw, type: 'optional-catchall', param }, errors }
  }

  if (raw.startsWith('[...') && raw.endsWith(']')) {
    const param = raw.slice(4, -1)
    validateParam(param, raw, errors)
    return { segment: { raw, type: 'catchall', param }, errors }
  }

  if (raw.startsWith('[') && raw.endsWith(']')) {
    const param = raw.slice(1, -1)
    validateParam(param, raw, errors)
    return { segment: { raw, type: 'dynamic', param }, errors }
  }

  errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
  return { segment: { raw, type: 'static' }, errors }
}

function validateParam(param: string, raw: string, errors: Error[]): void {
  if (param.includes('[') || param.includes(']')) {
    errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
    return
  }
  if (param.startsWith('.')) {
    errors.push(new Error(`Segment names may not start with erroneous periods ('${raw}').`))
    return
  }
  if (!param)
    errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
}
