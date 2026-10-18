import type { PartialPositionNode } from './partial-position-tree'
import type { RouteNode } from '@/pen-core/compiler/route'
import type { Endpoint, FrameContext } from './position-endpoints'
import { createPartialPositionTree } from './partial-position-tree'
import { createPositionEndpoints } from './position-endpoints'

export type PositionNode = Omit<PartialPositionNode, 'statics' | 'dynamic' | 'catchall'> & {
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
  endpoint?: Endpoint<PositionNode>
  fallback: Endpoint<PositionNode>
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
function getPageEndpoints(positions: Set<PositionNode>): Endpoint<PositionNode>[] {
  const endpoints: Endpoint<PositionNode>[] = []
  for (const position of positions)
    if (position.endpoint)
      endpoints.push(position.endpoint)
  return endpoints
}

export function createPositionTree(routeTree: RouteNode) {
  const [positionTree, positions, conflicts, ownershipOf, slotsOf] = createPartialPositionTree(routeTree)
  const positionNodes = positions as Set<PositionNode>
  const context: FrameContext<PositionNode> = {
    slotsOf,
    frameOf: new Map(),
    fallbackFrameOf: new Map(),
  }
  for (const position of positionNodes) {
    const [fallback, endpoint] = createPositionEndpoints(ownershipOf.get(position)!, context)
    position.fallback = fallback
    position.endpoint = endpoint
  }
  const modulePaths = getModulePaths(positionNodes)
  const pageEndpoints = getPageEndpoints(positionNodes)
  return [positionTree as PositionNode, conflicts, modulePaths, pageEndpoints] as const
}
