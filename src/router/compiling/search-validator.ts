import type { RouteNode } from './route-tree'
import type { SearchNode } from './search-tree'
import type { CompileDiagnostic } from './compile-diagnostic'
import { getRouteSource } from './route-tree'

function findConflictingRouteFiles(routeNodes?: RouteNode[]): string[] | undefined {
  if (!routeNodes) return
  if (routeNodes.length < 2) return
  return routeNodes.map(routeNode => routeNode.modulePaths.page!)
}

/** Runs relational validation between routes sharing the same URL position. */
export function validateSearchTree(nodes: SearchNode[]): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []

  for (const node of nodes) {
    const validation = node.validation
    const pageConflicts = findConflictingRouteFiles(validation?.pages)
    if (pageConflicts) {
      diagnostics.push({
        rule: 'duplicate-page-route',
        severity: 'error',
        message: 'multiple pages resolve to the same URL pattern',
        files: pageConflicts,
      })
    }
    const catchallConflicts = findConflictingRouteFiles(validation?.catchalls)
    if (catchallConflicts) {
      diagnostics.push({
        rule: 'duplicate-catchall-route',
        severity: 'error',
        message: 'multiple catch-all pages resolve to the same URL pattern',
        files: catchallConflicts,
      })
    }
    const dynamicRoutes = validation?.dynamics
    const params = dynamicRoutes && Object.keys(dynamicRoutes)
    if (params && params.length > 1) {
      diagnostics.push({
        rule: 'param-name-clash',
        severity: 'error',
        message: `two routes disagree on what to call the same URL parameter: ${params.join(' vs ')}`,
        files: Object.values(dynamicRoutes).map(getRouteSource),
      })
    }
  }
  return diagnostics
}

/** Drops each position's validation candidates now that validateSearchTree has
 *  had its look. This is also what releases the last references from the search tree
 *  into the route tree, so the route tree can be collected. */
export function sanitizeSearchTree(nodes: SearchNode[]) {
  for (const node of nodes)
    node.validation = undefined // cheaper than delete - avoids a hidden-class transition
}
