import { pickRecord } from '@/lib/record'
import type { Endpoint, Frame, PositionNode } from '../../compiler'
import type { MatchParams } from './find'
import { findPositionEndpoint } from './find'

/** A matched endpoint and its params, with every declared slot already resolved. */
export type Match = {
  endpoint: Endpoint<Match, MatchParams>
}
export type MatchEndpoint = Match['endpoint']
export type MatchFrame = MatchEndpoint['frames'][number]

/** Creates scoped params for each frame, reusing objects for unchanged scopes. */
function createMatchParamsForFrames(frames: Frame<PositionNode>[], fullParams: MatchParams) {
  let params: MatchParams = {}

  return frames.map((frame, index) => { // frames with the same values share the same params array
    if (frame.params !== frames[index-1]?.params) // only pickRecord if frames differ
      params = pickRecord(fullParams, frame.params)
    return params
  })
}

/** Resolves a slot's own match. Its frames can never declare further slots. */
function createMatchSlot(slotEndpoint: Endpoint<PositionNode>, fullSlotParams: MatchParams): Match {
  const slots = undefined // frame.slots is Record<string, PositionNode>; narrow it to satisfy Frame<Match>
  const params = createMatchParamsForFrames(slotEndpoint.frames, fullSlotParams)
  const frames = slotEndpoint.frames.map((frame, index) => ({ ...frame, params: params[index]!, slots }))
  const endpoint = { ...slotEndpoint, params: pickRecord(fullSlotParams, slotEndpoint.params), frames }
  return { endpoint }
}

/** Matches a pathname and resolves its frames and declared slots. */
export function match(positionTree: PositionNode, urlString: string): Match {
  const url = urlString.split('/').filter(Boolean)
  const [mainEndpoint, mainParams] = findPositionEndpoint(positionTree, url)

  const matchParamsForFrames = createMatchParamsForFrames(mainEndpoint.frames, mainParams)
  const frames = mainEndpoint.frames.map((frame, index) => {
    const matchParams = matchParamsForFrames[index]!  // get corresponding params
    const slots: Record<string, Match> = {}

    for (const [slotName, slotBoundary] of Object.entries(frame.slots ?? {})) {
      const [slotEndpoint, slotParams] = findPositionEndpoint(slotBoundary, url)
      const fullSlotParams = { ...matchParams, ...slotParams }
      slots[slotName] = createMatchSlot(slotEndpoint, fullSlotParams)
    }
    return { ...frame, slots, params: matchParams }
  })
  const params = pickRecord(mainParams, mainEndpoint.params)
  const endpoint = { ...mainEndpoint, frames, params }
  return { endpoint }
}
