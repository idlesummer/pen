import type { PartialPositionNode } from './position-partial-tree'
import type { RouteNode } from '@/pen-core/compiler/route'
import type { Endpoint, FrameContext } from './position-endpoints'
import { createPartialPositionTree } from './position-partial-tree'
import { createPositionEndpoints } from './position-endpoints'

export type PositionNode = Omit<PartialPositionNode, 'statics' | 'dynamic' | 'catchall'> & {
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
  pageEndpoint?: Endpoint<PositionNode>
  fallbackEndpoint: Endpoint<PositionNode>
}

// ── build ────────────────────────────────────────────────────────────────

/** Collects all unique module paths used by the position tree's endpoints and frames, including slots. */
function getModulePaths(positions: PositionNode[]): string[] {
  const modules = new Set<string>()
  for (const position of positions) {
    for (const endpoint of [position.pageEndpoint, position.fallbackEndpoint]) {
      if (!endpoint) continue

      modules.add(endpoint.contentPath)
      for (const { layout, loading, error, fallback } of endpoint.frames) {
        if (layout)   modules.add(layout)
        if (loading)  modules.add(loading)
        if (error)    modules.add(error)
        if (fallback) modules.add(fallback)
      }
    }
  }
  return [...modules].sort()
}

/** Collects real page endpoints, excluding fallbacks that render sentinels. */
function getPageEndpoints(positions: PositionNode[]): Endpoint<PositionNode>[] {
  const endpoints: Endpoint<PositionNode>[] = []
  for (const position of positions)
    if (position.pageEndpoint)
      endpoints.push(position.pageEndpoint)
  return endpoints
}

export function createPositionTree(routeTree: RouteNode) {
  const [positionTree, claimsOf, ownershipOf, slotsOf] = createPartialPositionTree(routeTree)
  const positionNodes = [...claimsOf.keys()] as PositionNode[]
  const context: FrameContext<PositionNode> = {
    slotsOf,
    frameOf: new Map(),
    fallbackFrameOf: new Map(),
  }
  for (const position of positionNodes) {
    const [fallbackEndpoint, pageEndpoint] = createPositionEndpoints(ownershipOf.get(position)!, context)
    position.fallbackEndpoint = fallbackEndpoint
    position.pageEndpoint = pageEndpoint
  }
  const modulePaths = getModulePaths(positionNodes)
  const pageEndpoints = getPageEndpoints(positionNodes)
  const claims = [...claimsOf.values()]
  return [positionTree as PositionNode, claims, modulePaths, pageEndpoints] as const
}
