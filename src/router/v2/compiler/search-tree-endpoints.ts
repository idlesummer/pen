import type { RouteNode } from './route-tree'
import type { Endpoint, Frame, SearchNode } from './search-node'
import { GLOBAL_DEFAULT } from '@/router/compiling/route-module'
import { isBoundary } from './segment'

/** What resolving endpoints actually needs from a finished traversal - not
 *  the whole BuildContext, which also carries conflict-tracking this stage
 *  never touches. */
export type ResolvedPositions = {
  searchNodes: SearchNode[]
  positionOf: Map<RouteNode, SearchNode>
  pageOwnerOf: Map<SearchNode, RouteNode>
  defaultOwnerOf: Map<SearchNode, RouteNode>
}

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
 *  chain, so there's no point giving it one. */
function createFrame(routeNode: RouteNode): Frame | undefined {
  const { layout, loading, error, default: def } = routeNode.modules
  const defaultPath = def ?? (isBoundary(routeNode.type) ? GLOBAL_DEFAULT : undefined)
  if (layout || loading || error || defaultPath)
    return { layout, loading, error, default: defaultPath }
}

/** The same frame without its own `default` - for an endpoint whose content
 *  IS that default, so it isn't also a boundary around itself. */
function removeDefault(frame: Frame): Frame {
  const { layout, loading, error } = frame
  return { layout, loading, error }
}

// ── endpoints ───────────────────────────────────────────────────────────

/** Flattens a folder's ancestry into the chain that wraps it - the walk the
 *  render stage would otherwise repeat on every navigation. */
function createEndpoint(pageOwner: RouteNode, content: string, positions: ResolvedPositions): Endpoint {
  const frames = compactMapAncestors(pageOwner, createFrame).reverse()
  const contentDepth = positions.positionOf.get(pageOwner)!.depth
  return { frames, content, contentDepth }
}

function createFallback(defaultOwner: RouteNode, content: string, positions: ResolvedPositions): Endpoint {
  const endpoint = createEndpoint(defaultOwner, content, positions)
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

/** Resolves every position's page (if it has one) and fallback (always) -
 *  runs once every folder's frame and page ownership is known. */
export function populateEndpoints(positions: ResolvedPositions) {
  for (const searchNode of positions.searchNodes) {
    const pageOwner = positions.pageOwnerOf.get(searchNode)
    if (pageOwner)
      searchNode.endpoint = createEndpoint(pageOwner, pageOwner.modules.page!, positions)

    const defaultOwner = positions.defaultOwnerOf.get(searchNode)!
    const content = defaultOwner.modules.default ?? GLOBAL_DEFAULT
    searchNode.fallback = createFallback(defaultOwner, content, positions)
  }
}
