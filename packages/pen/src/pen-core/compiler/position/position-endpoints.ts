import type { RouteNode } from '@/pen-core/compiler/route'
import type { Endpoint, Frame, PositionContext, PositionNode } from './position'
import { compactMapAncestors } from '@/pen-core/compiler/route'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from '../route/route-module'
import { isBoundary } from '../route/route-segment'

type PositionEndpoints = {
  endpoint?: Endpoint
  fallback: Endpoint
}

// ── frames ───────────────────────────────────────────────────────────────

/** Creates a folder's Frame, or undefined if it wraps nothing.
 *  Memoised by route folder so shared ancestry reuses the same Frame reference. */
function createFrame(routeNode: RouteNode, context: PositionContext): Frame | undefined {
  const frameOf = context.frameOf
  if (frameOf.has(routeNode))
    return frameOf.get(routeNode)

  const { layout, error: errorPath, loading, default: defaultPath } = routeNode.modules
  const error = errorPath ?? (routeNode.type === 'root' ? GLOBAL_ERROR : undefined)  // Only the root needs a global error fallback
  const _default = defaultPath ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  const slots = context.slotsOf.get(routeNode)

  if (layout || error || loading || _default || slots) {
    const paramCount = context.positionOf.get(routeNode)!.dynamicCount
    const frame = { layout, loading, error, default: _default, slots, paramCount }
    frameOf.set(routeNode, frame)
    return frame
  }
}

/** The same frame without its own `default` for an endpoint whose content is that default */
function createFallbackFrame(frame: Frame): Frame {
  const { layout, loading, error, slots, paramCount } = frame
  return { layout, loading, error, slots, paramCount }
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Creates a page endpoint with its precomputed wrapper chain and parameter count. */
function createEndpoint(pageOwner: RouteNode, contentPath: string, context: PositionContext): Endpoint {
  const frames = compactMapAncestors(pageOwner, node => createFrame(node, context)).reverse()
  const paramCount = context.positionOf.get(pageOwner)!.dynamicCount
  return { frames, contentPath, paramCount }
}

/** Creates a fallback endpoint, removing the innermost frame's default. Drops the frame if it doesn't contribute. */
function createFallback(defaultOwner: RouteNode, contentPath: string, context: PositionContext): Endpoint {
  const endpoint = createEndpoint(defaultOwner, contentPath, context)
  const lastFrame = endpoint.frames.pop() // pop on empty array returns undefined

  if (lastFrame && (lastFrame.layout || lastFrame.loading || lastFrame.error || lastFrame.slots)) {
    const fallbackFrame = context.fallbackFrameOf.getOrInsertComputed(lastFrame, createFallbackFrame)
    endpoint.frames.push(fallbackFrame) // replace the current frame with a fallback version of that same frame
  }
  return endpoint
}

/** Creates a position's page endpoint, if any, and its fallback. Requires every position's frame ancestors to be complete. */
export function createPositionEndpoints(position: PositionNode, context: PositionContext): PositionEndpoints {
  const pageOwner = context.pageOwnerOf.get(position)
  const pageContent = pageOwner?.modules.page
  const endpoint = pageContent ? createEndpoint(pageOwner, pageContent, context) : undefined

  const defaultOwner = context.defaultOwnerOf.get(position)!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  const fallback = createFallback(defaultOwner, defaultContent, context)
  return { endpoint, fallback }
}
