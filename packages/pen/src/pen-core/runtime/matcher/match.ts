import { pickRecord } from '@/lib/record'
import type { Endpoint, PositionNode } from '../../compiler'
import type { Params } from './find'
import { findPositionEndpoint } from './find'

/** A slot's own resolved endpoint - it can never declare further slots
 *  (structurally disallowed by the compiler), so its slot type bottoms out
 *  at `never` instead of looping back to Match. */
export type LeafEndpoint = Endpoint<never, Params>

/** A matched endpoint and its params, with every declared slot already
 *  resolved to its own leaf endpoint. */
export type Match = Endpoint<LeafEndpoint, Params>
export type MatchFrame = Match['frames'][number]

/** Pairs frames with their scoped params, reusing objects for unchanged scopes. */
function createMatchParams(frames: { params: string[] }[], fullParams: Params) {
  let params: Params = {}

  return frames.map((frame, index) => { // frames with the same values share the same params array
    if (frame.params !== frames[index-1]?.params) // only pickRecord if frames differ
      params = pickRecord(fullParams, frame.params)
    return params
  })
}

/** Resolves a slot's own endpoint - its frames can never declare further slots. */
function createLeafEndpoint(endpoint: Endpoint<unknown>, fullParams: Params): LeafEndpoint {
  const slots = undefined
  const params = createMatchParams(endpoint.frames, fullParams)
  const frames = endpoint.frames.map((frame, index) => ({ ...frame, params: params[index]!, slots }))
  return { ...endpoint, params: pickRecord(fullParams, endpoint.params), frames }
}

/** Matches a pathname and resolves its frames and declared slots. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = pathname.split('/').filter(Boolean)
  const [mainEndpoint, mainParams] = findPositionEndpoint(positionTree, url)

  const frameParams = createMatchParams(mainEndpoint.frames, mainParams)
  const frames = mainEndpoint.frames.map((frame, index) => {
    const params = frameParams[index]!
    const slots: Record<string, LeafEndpoint> = {}

    for (const [name, position] of Object.entries(frame.slots ?? {})) {
      const [slotEndpoint, slotParams] = findPositionEndpoint(position, url)
      const fullParams = { ...params, ...slotParams }
      slots[name] = createLeafEndpoint(slotEndpoint, fullParams)
    }
    return { ...frame, slots, params }
  })
  const params = pickRecord(mainParams, mainEndpoint.params)
  return { ...mainEndpoint, frames, params }
}
