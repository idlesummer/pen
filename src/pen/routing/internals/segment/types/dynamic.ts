import type { SegmentFile } from './types'

export const dynamicSegment: SegmentFile = {
  matches: (raw) => raw.startsWith('[') && raw.startsWith(']'),
  parse: (raw) => ({ raw, type: 'dynamic', param: raw.slice(1, -1) }),

  validateSelf: ({ raw, param }) => {
    const errors: Error[] = []
    if (!param)
      errors.push(new Error(`Segment names may not be empty ('${raw}').`))
    else if (param.includes('[') || param.includes(']'))
      errors.push(new Error(`Segment names may not start or end with extra brackets ('${raw}').`))
    else if (param.startsWith('.'))
      errors.push(new Error(`Segment names may not start with erroneous periods ('${raw}').`))
    return errors
  },

  validateChildren: (route) => {
    const errors: Error[] = []
    const dynamics = route.children.filter(c => c.segment.type === 'dynamic')
    if (dynamics.length > 1)
      errors.push(new Error(
        `You cannot use different slug names for the same dynamic path ` +
        `('${dynamics[0].segment.raw}' !== '${dynamics[1].segment.raw}').`
      ))
    return errors
  },

  validateAncestors: (route) => {
        if (!route.parent || route.segment.type !== 'dynamic') return []
    const seen = new Set<string>()
    for (let a = route.parent; a; a = a.parent!)
      if (a.segment.param) seen.add(a.segment.param)
    if (route.segment.param && seen.has(route.segment.param))
      return [new Error(
        `You cannot have the same slug name "${route.segment.param}" repeat within a single dynamic path`
      )]
    return []
  },
}
