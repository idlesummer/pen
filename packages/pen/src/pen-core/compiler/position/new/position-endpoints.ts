import type { PartialPositionNode } from './position-partial-tree'
import type { RouteNode } from '@/pen-core/compiler/route'
import type { Ownership } from './position-ownership'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, compactMapAncestors } from '@/pen-core/compiler/route'
import { isBoundary } from '@/pen-core/compiler/route/route-segment'

/** Folder modules wrapping a page endpoint. `P` is the slot position type. */
export type Frame<P> = {
  layout?: string
  loading?: string
  error?: string
  default?: string
  slots?: Record<string, P> // this folder's own declared slots
  paramCount: number  // is the number of dynamic parameters before the frame
}

/** Renderable route endpoint containing all the data needed for rendering. */
export type Endpoint<P> = {
  frames: Frame<P>[]  // last frame is the endpoint's parent
  contentPath: string // either page or default
  paramCount: number  // which position's params `contentPath` receives
}

/** Context for building frames and endpoints, with memoized frame reuse. */
export type FrameContext<P> = {
  slotsOf: Map<RouteNode, Record<string, PartialPositionNode>>
  frameOf: Map<RouteNode, Frame<P>>
  fallbackFrameOf: Map<Frame<P>, Frame<P>>
}

// ── frames ───────────────────────────────────────────────────────────────

/** Creates a route's Frame, or undefined if it wraps nothing. */
function createFrame<P>(routeNode: RouteNode, context: FrameContext<P>): Frame<P> | undefined {
  const frameOf = context.frameOf
  if (frameOf.has(routeNode))
    return frameOf.get(routeNode)

  const { layout, error: errorPath, loading, default: defaultPath } = routeNode.modules
  const error = errorPath ?? (routeNode.type === 'root' ? GLOBAL_ERROR : undefined)  // Only the root needs a global error fallback
  const default_ = defaultPath ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  const slots = context.slotsOf.get(routeNode) as Record<string, P> | undefined

  if (layout || error || loading || default_ || slots) {
    const paramCount = routeNode.paramCount
    const frame = { layout, loading, error, default: default_, slots, paramCount }
    frameOf.set(routeNode, frame)
    return frame
  }
}

/** The same frame without its own `default` for an endpoint whose content is that default */
function createFallbackFrame<P>(frame: Frame<P>): Frame<P> {
  const { layout, loading, error, slots, paramCount } = frame
  return { layout, loading, error, slots, paramCount }
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Creates a page endpoint with its precomputed wrapper chain and parameter count. */
function createEndpoint<P>(pageOwner: RouteNode, contentPath: string, context: FrameContext<P>): Endpoint<P> {
  const frames = compactMapAncestors(pageOwner, node => createFrame(node, context)).reverse()
  const paramCount = pageOwner.paramCount
  return { frames, contentPath, paramCount }
}

/** Creates a fallback endpoint, removing the innermost frame's default. Drops the frame if it doesn't contribute. */
function createFallback<P>(defaultOwner: RouteNode, contentPath: string, context: FrameContext<P>): Endpoint<P> {
  const endpoint = createEndpoint(defaultOwner, contentPath, context)
  const lastFrame = endpoint.frames.pop() // pop on empty array returns undefined

  if (lastFrame && (lastFrame.layout || lastFrame.loading || lastFrame.error || lastFrame.slots)) {
    const fallbackFrame = context.fallbackFrameOf.getOrInsertComputed(lastFrame, createFallbackFrame)
    endpoint.frames.push(fallbackFrame) // replace the current frame with a fallback version of that same frame
  }
  return endpoint
}

/** Creates a position's page endpoint, if any, and its fallback. */
export function createPositionEndpoints<P>(ownership: Ownership, context: FrameContext<P>) {
  const defaultOwner = ownership.default!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  const fallback = createFallback(defaultOwner, defaultContent, context)

  const pageOwner = ownership.page
  const pageContent = pageOwner?.modules.page
  const endpoint = pageContent ? createEndpoint(pageOwner, pageContent, context) : undefined
  return [fallback, endpoint] as const
}
