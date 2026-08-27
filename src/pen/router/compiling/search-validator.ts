import type { RouteNode } from './route-tree'
import type { SearchNode } from './search-tree'
import type { CompileDiagnostic } from './diagnostic'
import { getRouteSource } from './route-tree'
import { forEachSearchNode } from './search-tree'

function findConflictingRouteFiles(routeNodes?: RouteNode[]): string[] | undefined {
  if (!routeNodes) return
  if (routeNodes.length < 2) return
  return routeNodes.map(routeNode => routeNode.modulePaths.page!)
}

/** Runs relational validation between routes sharing the same URL position. */
export function validateSearchTree(searchTree: SearchNode): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []

  forEachSearchNode(searchTree, (searchNode) => {
    const validation = searchNode.validation
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
    if (dynamicRoutes && dynamicRoutes.size > 1) {
      const params = [...dynamicRoutes.keys()]
      diagnostics.push({
        rule: 'param-name-clash',
        severity: 'error',
        message: `two routes disagree on what to call the same URL parameter: ${params.join(' vs ')}`,
        files: [...dynamicRoutes.values()].map(getRouteSource),
      })
    }
  })
  return diagnostics
}

/** Drops each node's `validation` candidates now that validateSearchTree above
 *  has had its look - page/catchall are already live, set as each was
 *  collected. Must run after validateSearchTree, same as sanitizeRouteTree
 *  after validateRouteTree. */
export function sanitizeSearchTree(searchTree: SearchNode) {
  forEachSearchNode(searchTree, (searchNode) => {
    searchNode.validation = undefined // cheaper than delete - avoids a hidden-class transition
  })
}
