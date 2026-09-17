import type { RouteNode } from './route-tree'
import type { Endpoint, Frame, PositionContext, PositionNode } from './position-node'
import { GLOBAL_DEFAULT } from './route-module'
import { isBoundary } from './route-segment'

function compactMapAncestors<T>(routeNode: RouteNode, fn: (node: RouteNode) => T | undefined): T[] {
  const values: T[] = []
  // No condition needed since we always stop at a default or boundary
  for (let node = routeNode; ; node = node.parent!) {
    const value = fn(node)
    if (value !== undefined)   values.push(value)
    if (isBoundary(node.type)) break
  }
  return values
}

// ── frames ───────────────────────────────────────────────────────────────

/** A folder's own Frame, or undefined if it wraps nothing at all - a plain
 *  folder with no layout/loading/error/default/slots contributes nothing to
 *  the chain, so there's no point giving it one.
 *
 *  Memoised in context.frameOf, including the undefined case - the same
 *  folder is reached by createEndpoint once per position that shares it as
 *  an ancestor (its own page, and every descendant's fallback), and should
 *  hand back the exact same Frame reference every time rather than a fresh
 *  equal-but-distinct copy per call.
 *
 *  Slots are looked up by the folder's own identity (routeNode), not by
 *  position - a slot only reaches its real ancestors/descendants in the
 *  route tree. Two folders that merely collapse onto the same position via
 *  a group do NOT share slots: verified against a real Next.js build, where
 *  a route-group sibling that loses page ownership for a URL never gets its
 *  slots passed anywhere either, regardless of sharing that URL. */
function createFrame(routeNode: RouteNode, context: PositionContext): Frame | undefined {
  const frameOf = context.frameOf
  if (frameOf.has(routeNode))
    return frameOf.get(routeNode)

  const { layout, loading, error, default: def } = routeNode.modules
  const defaultPath = def ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  const slots = context.slotsOf.get(routeNode)
  const frame = (!layout && !loading && !error && !defaultPath && !slots)
    ? undefined
    : { layout, loading, error, default: defaultPath, slots, paramDepth: -context.positionOf.get(routeNode)!.staticness }

  frameOf.set(routeNode, frame)
  return frame
}

/** The same frame without its own `default` - for an endpoint whose content
 *  IS that default, so it isn't also a boundary around itself. Memoised for
 *  the same reason createFrame is: every position resolving to the same
 *  owner wants the same stripped frame, not a fresh copy each time. */
function removeDefault(frame: Frame, context: PositionContext): Frame {
  return context.strippedOf.getOrInsertComputed(frame, () => {
    const { layout, loading, error, slots, paramDepth } = frame
    return { layout, loading, error, slots, paramDepth }
  })
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Flattens a folder's ancestry into the chain that wraps it - the walk the
 *  render stage would otherwise repeat on every navigation. */
function createEndpoint(pageOwner: RouteNode, content: string, context: PositionContext): Endpoint {
  const frames = compactMapAncestors(pageOwner, node => createFrame(node, context)).reverse()
  const contentDepth = -context.positionOf.get(pageOwner)!.staticness
  return { frames, content, contentDepth }
}

function createFallback(defaultOwner: RouteNode, content: string, context: PositionContext): Endpoint {
  const endpoint = createEndpoint(defaultOwner, content, context)
  const frames = endpoint.frames
  const lastFrame = frames[frames.length-1]
  if (!lastFrame)
    return endpoint

  // The innermost frame renders the fallback itself, so remove its default -
  // unless that default was the only thing keeping the frame alive, in which
  // case drop the frame entirely. Slots count as keeping it alive too: a
  // frame that exists only to carry them must survive losing its default.
  if (lastFrame.layout || lastFrame.loading || lastFrame.error || lastFrame.slots)
    frames[frames.length-1] = removeDefault(lastFrame, context)
  else
    frames.pop()
  return endpoint
}

/** Resolves one position's page (if it has one) and fallback (always) - safe
 *  to call once every folder's frame and page ownership is known. */
export function setEndpoints(positionNode: PositionNode, context: PositionContext) {
  const pageOwner = context.pageOwnerOf.get(positionNode)
  const pageContent = pageOwner?.modules.page
  if (pageContent)
    positionNode.endpoint = createEndpoint(pageOwner, pageContent, context)

  const defaultOwner = context.defaultOwnerOf.get(positionNode)!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  positionNode.fallback = createFallback(defaultOwner, defaultContent, context)
}
