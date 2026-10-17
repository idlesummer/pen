import type { PartialPositionNode } from './partial-position-tree'
import type { RouteNode } from '@/pen-core/compiler/route'
import { compactMapAncestors } from '@/pen-core/compiler/route'
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

export type PositionNode = Omit<PartialPositionNode, 'statics' | 'dynamic' | 'catchall'> & {
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
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

function createPositionEndpoints(position: PositionNode, context: PositionContext): PositionEndpoints {
  const pageOwner = context.pageOwnerOf.get(position)
  const pageContent = pageOwner?.modules.page
  const endpoint = pageContent ? createEndpoint(pageOwner, pageContent, context) : undefined

  const defaultOwner = context.defaultOwnerOf.get(position)!  // always set; worst case, a boundary
  const defaultContent = defaultOwner.modules.default ?? GLOBAL_DEFAULT
  const fallback = createFallback(defaultOwner, defaultContent, context)
  return { endpoint, fallback }
}

export function createPositionTree(routeTree: RouteNode) {
  const [positionTree, positions, conflicts, ownership] = createPartialPositionTree(routeTree)
  for (const position of positions as Set<PositionNode>) {
    const endpoints = createPositionEndpoints(position, ownership)
    Object.assign(position, endpoints)
  }
  const modulePaths = getModulePaths(positions)
  const pageEndpoints = getPageEndpoints(positions)
  return [positionTree as PositionNode, conflicts, modulePaths, pageEndpoints] as const
}
