import type { RouteNode } from '../route'
import type { Endpoint, PositionClaims, PositionNode } from './position'
import { createPositionEndpoints } from './position-endpoints'
import { createPositionTree } from './position-tree'

export type PositionTreeData = {
  positionTree: PositionNode
  modulePaths: string[]
  conflicts: PositionClaims[]
  pageEndpoints: Endpoint[]
}

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

export function createPositionTreeData(routeTree: RouteNode): PositionTreeData {
  const { positionTree, positions, conflicts, context } = createPositionTree(routeTree)
  for (const position of positions) {
    const { endpoint, fallback } = createPositionEndpoints(position, context)
    position.endpoint = endpoint
    position.fallback = fallback
  }
  const modulePaths = getModulePaths(positions)
  const pageEndpoints = getPageEndpoints(positions)
  return { positionTree, conflicts, modulePaths, pageEndpoints }
}
