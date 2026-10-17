import type { PartialPositionNode } from './partial-position-tree'
import type { RouteNode } from '@/pen-core/compiler/route'
import type { PositionOwnership } from './position-ownership'
import { GLOBAL_DEFAULT, GLOBAL_ERROR, compactMapAncestors } from '@/pen-core/compiler/route'
import { isBoundary } from '@/pen-core/compiler/route/route-segment'
import { createPartialPositionTree } from './partial-position-tree'

/** Represents the module folders that wrap a page endpoint. */
type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
  slots?: Record<string, PositionNode> // this folder's own declared slots
  paramCount: number  // is the number of dynamic parameters before the frame
}

/** Renderable route endpoint containing all the data needed for rendering. */
type Endpoint = {
  frames: Frame[]     // last frame is the endpoint's parent
  contentPath: string // either page or default
  paramCount: number  // which position's params `contentPath` receives
}

type PositionEndpoints = {
  endpoint?: Endpoint
  fallback: Endpoint
}

export type PositionNode = Omit<PartialPositionNode, 'statics' | 'dynamic' | 'catchall'> & {
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
  endpoint?: Endpoint
  fallback: Endpoint
}

/** State needed to build a position's rendering frames/endpoints, once the
 *  position tree's shape already exists. `frameOf`/`fallbackFrameOf` memoize
 *  frames to reuse references instead of creating duplicate objects. */
type FrameContext = {
  slotsOf: Map<RouteNode, Record<string, PartialPositionNode>>
  frameOf: Map<RouteNode, Frame>
  fallbackFrameOf: Map<Frame, Frame>
}

// ── frames ───────────────────────────────────────────────────────────────

/** Creates a folder's Frame, or undefined if it wraps nothing.
 *  Memoised by route folder so shared ancestry reuses the same Frame reference. */
function createFrame(routeNode: RouteNode, context: FrameContext): Frame | undefined {
  const frameOf = context.frameOf
  if (frameOf.has(routeNode))
    return frameOf.get(routeNode)

  const { layout, error: errorPath, loading, default: defaultPath } = routeNode.modules
  const error = errorPath ?? (routeNode.type === 'root' ? GLOBAL_ERROR : undefined)  // Only the root needs a global error fallback
  const _default = defaultPath ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  const slots = context.slotsOf.get(routeNode) as Record<string, PositionNode> | undefined

  if (layout || error || loading || _default || slots) {
    const paramCount = routeNode.paramCount
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
function createEndpoint(pageOwner: RouteNode, contentPath: string, context: FrameContext): Endpoint {
  const frames = compactMapAncestors(pageOwner, node => createFrame(node, context)).reverse()
  const paramCount = pageOwner.paramCount
  return { frames, contentPath, paramCount }
}

/** Creates a fallback endpoint, removing the innermost frame's default. Drops the frame if it doesn't contribute. */
function createFallback(defaultOwner: RouteNode, contentPath: string, context: FrameContext): Endpoint {
  const endpoint = createEndpoint(defaultOwner, contentPath, context)
  const lastFrame = endpoint.frames.pop() // pop on empty array returns undefined

  if (lastFrame && (lastFrame.layout || lastFrame.loading || lastFrame.error || lastFrame.slots)) {
    const fallbackFrame = context.fallbackFrameOf.getOrInsertComputed(lastFrame, createFallbackFrame)
    endpoint.frames.push(fallbackFrame) // replace the current frame with a fallback version of that same frame
  }
  return endpoint
}

/** Creates a position's page endpoint, if any, and its fallback. */
function createPositionEndpoints(ownership: PositionOwnership, context: FrameContext): PositionEndpoints {
  const pageOwner = ownership.page
  const pageContent = pageOwner?.modules.page
  const endpoint = pageContent ? createEndpoint(pageOwner, pageContent, context) : undefined

  const defaultOwner = ownership.default!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  const fallback = createFallback(defaultOwner, defaultContent, context)
  return { endpoint, fallback }
}

// ── build ────────────────────────────────────────────────────────────────

/** Collects all unique module paths used by the position tree's endpoints and frames, including slots. */
function getModulePaths(positions: Set<PositionNode>): string[] {
  const modules = new Set<string>()

  for (const position of positions) {
    for (const endpoint of [position.endpoint, position.fallback]) {
      if (!endpoint) continue

      modules.add(endpoint.contentPath)
      for (const { layout, loading, error, default: default_ } of endpoint.frames) {
        if (layout)   modules.add(layout)
        if (loading)  modules.add(loading)
        if (error)    modules.add(error)
        if (default_) modules.add(default_)
      }
    }
  }
  return [...modules].sort()
}

/** Collects real page endpoints, excluding fallbacks that render sentinels. */
function getPageEndpoints(positions: Set<PositionNode>): Endpoint[] {
  const endpoints: Endpoint[] = []
  for (const position of positions)
    if (position.endpoint)
      endpoints.push(position.endpoint)
  return endpoints
}

export function createPositionTree(routeTree: RouteNode) {
  const [positionTree, positions, conflicts, ownershipOf, slotsOf] = createPartialPositionTree(routeTree)
  const context: FrameContext = { slotsOf, frameOf: new Map(), fallbackFrameOf: new Map() }
  const positionNodes = positions as Set<PositionNode>

  for (const position of positionNodes) {
    const ownership = ownershipOf.get(position)!
    Object.assign(position, createPositionEndpoints(ownership, context))
  }
  const modulePaths = getModulePaths(positionNodes)
  const pageEndpoints = getPageEndpoints(positionNodes)
  return [positionTree as PositionNode, conflicts, modulePaths, pageEndpoints] as const
}
