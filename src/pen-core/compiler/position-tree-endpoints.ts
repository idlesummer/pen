import type { RouteNode } from './route-tree'
import type { Endpoint, Frame, PositionContext, PositionNode } from './position-node'
import { compactMapAncestors } from './route-tree'
import { GLOBAL_DEFAULT, GLOBAL_ERROR } from './route-module'
import { isBoundary } from './route-segment'

// ── frames ───────────────────────────────────────────────────────────────

/** Creates a folder's Frame, or undefined if it wraps nothing.
 *  Memoised by folder so shared ancestry reuses the same Frame reference. */
function createFrame(routeNode: RouteNode, context: PositionContext): Frame | undefined {
  const frameOf = context.frameOf
  if (frameOf.has(routeNode))
    return frameOf.get(routeNode)

  const { layout, loading, error, default: def } = routeNode.modules
  const _default = def ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  // Only the true root, never a slot - unlike default, an error boundary
  // composes through the render tree regardless of which chain constructed
  // it, so a slot's content is already covered by whatever wraps the root.
  const _error = error ?? (routeNode.type === 'root' ? GLOBAL_ERROR : undefined)
  const paramCount = -context.positionOf.get(routeNode)!.staticness
  const slots = context.slotsOf.get(routeNode)
  const frame = (layout || loading || _error || _default || slots)
    ? { layout, loading, error: _error, default: _default, slots, paramCount }
    : undefined
  frameOf.set(routeNode, frame)
  return frame
}

/** The same frame without its own `default` - for an endpoint whose content is that default */
function createFallbackFrame(frame: Frame): Frame {
  const { layout, loading, error, slots, paramCount } = frame
  return { layout, loading, error, slots, paramCount }
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Flattens a folder's ancestry into the chain that wraps it - the walk the
 *  render stage would otherwise repeat on every navigation. */
function createEndpoint(pageOwner: RouteNode, contentPath: string, context: PositionContext): Endpoint {
  const frames = compactMapAncestors(pageOwner, node => createFrame(node, context)).reverse()
  const contentDepth = -context.positionOf.get(pageOwner)!.staticness
  return { frames, contentPath, contentDepth }
}

function createFallback(defaultOwner: RouteNode, contentPath: string, context: PositionContext): Endpoint {
  const endpoint = createEndpoint(defaultOwner, contentPath, context)
  const frames = endpoint.frames
  const lastFrame = frames[frames.length-1]
  if (!lastFrame) // undefined last frame means list is empty
    return endpoint

  // The innermost frame renders the fallback itself, so remove its default.
  // If the default was its only contribution, drop the frame; slots still count.
  const fallbackFrameOf = context.fallbackFrameOf
  if (lastFrame.layout || lastFrame.loading || lastFrame.error || lastFrame.slots)
    frames[frames.length-1] = fallbackFrameOf.getOrInsertComputed(lastFrame, createFallbackFrame)
  else
    frames.pop()
  return endpoint
}

/** Resolves one position's page (if it has one) and fallback (always) - safe
 *  to call once every folder's frame and page ownership is known. */
export function setEndpoints(position: PositionNode, context: PositionContext) {
  const pageOwner = context.pageOwnerOf.get(position)
  const pageContent = pageOwner?.modules.page
  if (pageContent)
    position.endpoint = createEndpoint(pageOwner, pageContent, context)

  const defaultOwner = context.defaultOwnerOf.get(position)!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  position.fallback = createFallback(defaultOwner, defaultContent, context)
}
