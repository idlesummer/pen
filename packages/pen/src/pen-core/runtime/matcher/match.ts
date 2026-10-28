import type { Endpoint, Frame, PositionNode } from '../../compiler'
import type { Params } from './find-position-endpoint'
import { omitRecord } from '@/lib/record'
import { findPositionEndpoint } from './find-position-endpoint'

/** A matched endpoint and its params, with every declared slot already resolved. */
export type Match = {
  name: string    // this match's slot name; '' for the root match
  endpoint: Endpoint<Match, Params>
  params: Params  // every param bound reaching this position, in bind order
}
export type MatchEndpoint = Match['endpoint']
export type MatchFrame = MatchEndpoint['frames'][number]

/** Pairs each frame with its own bound params, reusing the same object
 *  across consecutive frames that don't bind a new param. */
function withFrameParams(frames: Frame<PositionNode>[], fullParams: Params): [Frame<PositionNode>, Params][] {
  let boundNames: string[] = []
  let frameParams: Params = {}

  return frames.map((frame) => {
    if (frame.params !== boundNames) {
      const newNames = frame.params.slice(boundNames.length)
      frameParams = { ...frameParams, ...Object.fromEntries(newNames.map(name => [name, fullParams[name]!])) }
      boundNames = frame.params
    }
    return [frame, frameParams]
  })
}

/** Builds a slot's own frames - they can never declare further slots, so
 *  this never needs to look for any. */
function createLeafMatchFrames(frames: Frame<PositionNode>[], fullParams: Params): MatchFrame[] {
  return withFrameParams(frames, fullParams).map(([frame, params]) => ({ ...frame, slots: undefined, params }))
}

/** Resolves a slot's own endpoint, with its frames narrowed the same way. */
function createLeafMatchEndpoint(endpoint: Endpoint<PositionNode>, fullParams: Params): MatchEndpoint {
  const frames = createLeafMatchFrames(endpoint.frames, fullParams)
  const params = Object.fromEntries(endpoint.params.map(name => [name, fullParams[name]!]))
  return { ...endpoint, frames, params }
}

/** Matches a slot without resolving its own slots. */
function createMatchFrameSlot(name: string, position: PositionNode, url: string[], seedParams: Params): Match {
  const [slotEndpoint, slotParams] = findPositionEndpoint(position, url)
  const params = { ...seedParams, ...slotParams }
  const frames = slotEndpoint.frames.map(frame => omitRecord(frame, 'slots'))
  const endpoint = createLeafMatchEndpoint({ ...slotEndpoint, frames }, params)
  return { name, endpoint, params }
}

function createMatchFrame(frame: Frame<PositionNode>, url: string[], frameParams: Params): MatchFrame {
  const slots: Record<string, Match> = {}

  for (const [name, position] of Object.entries(frame.slots ?? {}))
    slots[name] = createMatchFrameSlot(name, position, url, frameParams)
  return { ...frame, slots, params: frameParams }
}

/** Builds the main chain's frames, resolving each one's own declared slots. */
function createMatchFrames(frames: Frame<PositionNode>[], url: string[], fullParams: Params): MatchFrame[] {
  return withFrameParams(frames, fullParams).map(([frame, params]) => createMatchFrame(frame, url, params))
}

/** Resolves an endpoint's frame chain and its own bound param names. */
function createMatchEndpoint(endpoint: Endpoint<PositionNode>, url: string[], fullParams: Params): MatchEndpoint {
  const frames = createMatchFrames(endpoint.frames, url, fullParams)
  const params = Object.fromEntries(endpoint.params.map(name => [name, fullParams[name]!]))
  return { ...endpoint, frames, params }
}

/** Matches a pathname and its declared slots against the position tree. */
export function match(positionTree: PositionNode, pathname: string): Match {
  const url = pathname.split('/').filter(Boolean)
  const [mainEndpoint, mainParams] = findPositionEndpoint(positionTree, url)
  const endpoint = createMatchEndpoint(mainEndpoint, url, mainParams)
  return { name: '', endpoint, params: mainParams }
}
