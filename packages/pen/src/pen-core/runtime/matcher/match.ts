import { pickRecord } from '@/lib/record'
import type { Endpoint, Frame, PositionNode } from '../../compiler'
import type { Params } from './find'
import { findPositionEndpoint } from './find'

/** A matched endpoint and its params, with every declared slot already resolved. */
export type Match = {
  endpoint: Endpoint<Match, Params>
}
export type MatchEndpoint = Match['endpoint']
export type MatchFrame = MatchEndpoint['frames'][number]

/** Pairs frames with their scoped params, reusing objects for unchanged scopes. */
function createMatchParams(frames: Frame<PositionNode>[], fullParams: Params) {
  let params: Params = {}

  return frames.map((frame, index) => { // frames with the same values share the same params array
    if (frame.params !== frames[index-1]?.params) // only pickRecord if frames differ
      params = pickRecord(fullParams, frame.params)
    return params
  })
}

/** Resolves a slot's own match - its frames can never declare further slots. */
function createMatchSlot(endpoint: Endpoint<PositionNode>, fullParams: Params): Match {
  const slots = undefined
  const params = createMatchParams(endpoint.frames, fullParams)
  const frames = endpoint.frames.map((frame, index) => ({ ...frame, params: params[index]!, slots }))
  return { endpoint: { ...endpoint, params: pickRecord(fullParams, endpoint.params), frames } }
}

/** Matches a pathname and resolves its frames and declared slots. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = pathname.split('/').filter(Boolean)
  const [positionEndpoint, mainParams] = findPositionEndpoint(positionTree, url)

  const frameParams = createMatchParams(positionEndpoint.frames, mainParams)
  const frames = positionEndpoint.frames.map((frame, index) => {
    const params = frameParams[index]!  // get corresponding params
    const slots: Record<string, Match> = {}

    for (const [slotName, slotBoundary] of Object.entries(frame.slots ?? {})) {
      const [slotEndpoint, slotParams] = findPositionEndpoint(slotBoundary, url)
      const fullParams = { ...params, ...slotParams }
      slots[slotName] = createMatchSlot(slotEndpoint, fullParams)
    }
    return { ...frame, slots, params }
  })
  const params = pickRecord(mainParams, positionEndpoint.params)
  const endpoint = { ...positionEndpoint, frames, params }
  return { endpoint }
}
