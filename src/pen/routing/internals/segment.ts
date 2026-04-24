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

  if (raw.startsWith('[[...') && raw.endsWith(']]'))
    return { raw, type: 'optional-catchall', param: raw.slice(5, -2) }

  if (raw.startsWith('[...') && raw.endsWith(']'))
    return { raw, type: 'catchall', param: raw.slice(4, -1) }

  if (raw.startsWith('[') && raw.endsWith(']'))
    return { raw, type: 'dynamic', param: raw.slice(1, -1) }

  return { raw, type: 'static' }
}

export function validate(segment: Segment): Error[] {
  const errors: Error[] = []
  const { raw, type, param } = segment

  if (raw.includes('…'))
    errors.push(new Error(`Detected a three-dot character ('…') at ('${raw}'). Did you mean ('...')?`))

  if (type === 'group')
    return errors

  if (type === 'static') {
    if (raw.includes('[') || raw.includes(']'))
      errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
    return errors
  }

  if (!param)
    errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
  else if (param.includes('[') || param.includes(']'))
    errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
  else if (param.startsWith('.'))
    errors.push(new Error(`Segment names may not start with erroneous periods ('${raw}').`))

  return errors
}
