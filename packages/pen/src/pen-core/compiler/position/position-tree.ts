import type { PartialPositionNode } from './position-partial-tree'
import type { RouteNode } from '@/pen-core/compiler/route'
import type { Endpoint, FrameContext } from './position-endpoints'
import { createPartialPositionTree } from './position-partial-tree'
import { createPositionEndpoints } from './position-endpoints'

/** A slot's own position - it can never declare further slots. */
export type LeafPositionNode = Omit<PartialPositionNode, 'statics' | 'dynamic' | 'catchall'> & {
  // Children
  statics?: Record<string, LeafPositionNode>
  dynamic?: LeafPositionNode
  catchall?: LeafPositionNode
  // Rendering
  endpoint?: Endpoint<never>
  fallback: Endpoint<never>
}

export type PositionNode = Omit<PartialPositionNode, 'statics' | 'dynamic' | 'catchall'> & {
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
  endpoint?: Endpoint<LeafPositionNode>
  fallback: Endpoint<LeafPositionNode>
}

// ── build ────────────────────────────────────────────────────────────────

/** Collects all unique module paths used by the position tree's endpoints and frames, including slots. */
function getModulePaths(positions: { endpoint?: Endpoint<unknown>; fallback: Endpoint<unknown> }[]): string[] {
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
function getPageEndpoints(positions: { endpoint?: Endpoint<unknown> }[]): Endpoint<unknown>[] {
  const endpoints: Endpoint<unknown>[] = []
  for (const position of positions)
    if (position.endpoint)
      endpoints.push(position.endpoint)
  return endpoints
}

export function createPositionTree(routeTree: RouteNode) {
  const [positionTree, claimsOf, ownershipOf, slotsOf, leafPositions] = createPartialPositionTree(routeTree)
  const allPositions = [...claimsOf.keys()]

  const mainContext: FrameContext<LeafPositionNode> = { slotsOf, frameOf: new Map(), fallbackFrameOf: new Map() }
  const leafContext: FrameContext<never> = { slotsOf, frameOf: new Map(), fallbackFrameOf: new Map() }

  for (const position of allPositions) {
    if (leafPositions.has(position)) {
      const leafPosition = position as LeafPositionNode
      const [fallback, endpoint] = createPositionEndpoints(ownershipOf.get(position)!, leafContext)
      leafPosition.fallback = fallback
      leafPosition.endpoint = endpoint
    }
    else {
      const mainPosition = position as PositionNode
      const [fallback, endpoint] = createPositionEndpoints(ownershipOf.get(position)!, mainContext)
      mainPosition.fallback = fallback
      mainPosition.endpoint = endpoint
    }
  }
  const positionNodes = allPositions as (PositionNode | LeafPositionNode)[]
  const modulePaths = getModulePaths(positionNodes)
  const pageEndpoints = getPageEndpoints(positionNodes)
  const claims = [...claimsOf.values()]
  return [positionTree as PositionNode, claims, modulePaths, pageEndpoints] as const
}
