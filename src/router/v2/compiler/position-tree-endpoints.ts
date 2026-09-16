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
 *  folder with no layout/loading/error/default contributes nothing to the
 *  chain, so there's no point giving it one.
 *
 *  Slots are looked up by the folder's own identity (routeNode), not by
 *  position - a slot only reaches its real ancestors/descendants in the
 *  route tree. Two folders that merely collapse onto the same position via
 *  a group do NOT share slots: verified against a real Next.js build, where
 *  a route-group sibling that loses page ownership for a URL never gets its
 *  slots passed anywhere either, regardless of sharing that URL. */
function createFrame(routeNode: RouteNode, ctx: PositionContext): Frame | undefined {
  const { layout, loading, error, default: def } = routeNode.modules
  const defaultPath = def ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  if (!layout && !loading && !error && !defaultPath)
    return

  const position = ctx.positionOf.get(routeNode)!
  const slots = ctx.slotsOf.get(routeNode)
  return { layout, loading, error, default: defaultPath, slots, paramDepth: position.boundaryDepth }
}

/** The same frame without its own `default` - for an endpoint whose content
 *  IS that default, so it isn't also a boundary around itself. */
function removeDefault(frame: Frame): Frame {
  const { layout, loading, error, slots, paramDepth } = frame
  return { layout, loading, error, slots, paramDepth }
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Flattens a folder's ancestry into the chain that wraps it - the walk the
 *  render stage would otherwise repeat on every navigation. */
function createEndpoint(pageOwner: RouteNode, content: string, ctx: PositionContext): Endpoint {
  const frames = compactMapAncestors(pageOwner, node => createFrame(node, ctx)).reverse()
  const contentDepth = ctx.positionOf.get(pageOwner)!.boundaryDepth
  return { frames, content, contentDepth }
}

function createFallback(defaultOwner: RouteNode, content: string, ctx: PositionContext): Endpoint {
  const endpoint = createEndpoint(defaultOwner, content, ctx)
  const frames = endpoint.frames
  const lastFrame = frames[frames.length-1]
  if (!lastFrame)
    return endpoint

  // The innermost frame renders the fallback itself, so remove its default.
  if (lastFrame.layout || lastFrame.loading || lastFrame.error)
    frames[frames.length-1] = removeDefault(lastFrame)
  else
    frames.pop()
  return endpoint
}

/** Resolves one position's page (if it has one) and fallback (always) - safe
 *  to call once every folder's frame and page ownership is known. */
export function setEndpoints(positionNode: PositionNode, ctx: PositionContext) {
  const pageOwner = ctx.pageOwnerOf.get(positionNode)
  const pageContent = pageOwner?.modules.page
  if (pageContent)
    positionNode.endpoint = createEndpoint(pageOwner, pageContent, ctx)

  const defaultOwner = ctx.defaultOwnerOf.get(positionNode)!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  positionNode.fallback = createFallback(defaultOwner, defaultContent, ctx)
}
