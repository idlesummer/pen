import type { RouteNode } from './route-tree'
import type { SearchNode } from './search-tree'
import { forEachReachableRouteNode, getSlotAncestor } from './route-tree'
import { forEachSearchNode } from './search-tree'

export type CompileDiagnostic = {
  rule: string
  severity: 'error' | 'warning'
  message: string
  files: string[]
}

function getDiagnosticPath(routeNode: RouteNode): string {
  return Object.values(routeNode.modulePaths)[0] ?? routeNode.path
}

function findDuplicateParam(routeNode: RouteNode): string | undefined {
  const params = new Set<string>()
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) {
    const segmentType = node.segment.type
    if (segmentType !== 'dynamic' && segmentType !== 'catchall')
      continue

    const paramName = node.segment.value
    if (params.has(paramName))
      return paramName
    params.add(paramName)
  }
}

/** Runs intrinsic validation on each node and its ancestry on the raw tree. */
export function validateRouteTree(root: RouteNode): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []

  forEachReachableRouteNode(root, (routeNode) => {
    const segmentType = routeNode.segment.type

    if (segmentType === 'malformed') {
      return void diagnostics.push({
        rule: 'malformed-segment',
        severity: 'error',
        message: `"${routeNode.name}": ${routeNode.segment.value}`,
        files: [getDiagnosticPath(routeNode)],
      })
    }
    if (segmentType === 'catchall' && routeNode.children.length) {
      diagnostics.push({
        rule: 'non-terminal-catchall',
        severity: 'warning',
        message:
          `"${routeNode.path}" is a catch-all route and must be terminal, ` +
          'but has routes nested beneath it that can never be reached',
        files: [getDiagnosticPath(routeNode)],
      })
    }
    if (segmentType === 'slot') {
      const ancestorRouteNode = getSlotAncestor(routeNode)
      if (ancestorRouteNode) {
        diagnostics.push({
          rule: 'nested-slot',
          severity: 'error',
          message:
            `"${routeNode.path}" is a slot nested inside slot "${ancestorRouteNode.path}" ` +
            '- slot subtrees are terminal and can\'t declare further slots',
          files: [getDiagnosticPath(routeNode)],
        })
      }
    }
    if (segmentType === 'dynamic' || segmentType === 'catchall') {
      const paramName = findDuplicateParam(routeNode)
      if (paramName) diagnostics.push({
        rule: 'repeated-param-name',
        severity: 'error',
        message: `"${paramName}" is used more than once as a dynamic segment name in this route's path`,
        files: [getDiagnosticPath(routeNode)],
      })
    }
  })
  return diagnostics
}

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
        files: [...dynamicRoutes.values()].map(getDiagnosticPath),
      })
    }
  })
  return diagnostics
}
