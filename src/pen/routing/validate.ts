import type { RouteNode } from './route-tree.js'
import type { SearchNode } from './search-tree.js'
import { getRoutePath, forEachReachableRouteNode } from './route-tree.js'
import { forEachSearchNode } from './search-tree.js'

export type RouteIssue = {
  rule: string
  severity: 'error' | 'warning'
  message: string
  files: string[]
}

function getDiagnosticPath(routeNode: RouteNode): string {
  return routeNode.modulePaths.values().next().value ?? getRoutePath(routeNode)
}

export function findNearestSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent) {
    if (node.segment.type === 'slot')
      return node
  }
}

function findDuplicateParam(routeNode: RouteNode): string | undefined {
  const params = new Set<string>()
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) {
    if (node.segment.type !== 'dynamic' && node.segment.type !== 'catchall')
      continue

    if (params.has(node.segment.value))
      return node.segment.value
    params.add(node.segment.value)
  }
}

/** Runs intrinsic validation on each node and its ancestry on the raw tree. */
export function validateRouteTree(root: RouteNode): RouteIssue[] {
  const issues: RouteIssue[] = []

  forEachReachableRouteNode(root, (routeNode) => {
    if (routeNode.segment.type === 'malformed') {
      return void issues.push({
        rule: 'malformed-segment',
        severity: 'error',
        message: `"${routeNode.name}": ${routeNode.segment.value}`,
        files: [getDiagnosticPath(routeNode)],
      })
    }
    if (routeNode.segment.type === 'catchall' && routeNode.children.length) {
      issues.push({
        rule: 'non-terminal-catchall',
        severity: 'warning',
        message:
          `"${getRoutePath(routeNode)}" is a catch-all route and must be terminal, ` +
          'but has routes nested beneath it that can never be reached',
        files: [getDiagnosticPath(routeNode)],
      })
    }
    if (routeNode.segment.type === 'slot') {
      const ancestorRouteNode = findNearestSlotAncestor(routeNode)
      if (ancestorRouteNode) {
        issues.push({
          rule: 'nested-slot',
          severity: 'error',
          message:
            `"${getRoutePath(routeNode)}" is a slot nested inside slot "${getRoutePath(ancestorRouteNode)}" ` +
            '- slot subtrees are terminal and can\'t declare further slots',
          files: [getDiagnosticPath(routeNode)],
        })
      }
    }
    if (routeNode.segment.type === 'dynamic' || routeNode.segment.type === 'catchall') {
      const param = findDuplicateParam(routeNode)
      if (param) issues.push({
        rule: 'repeated-param-name',
        severity: 'error',
        message: `"${param}" is used more than once as a dynamic segment name in this route's path`,
        files: [getDiagnosticPath(routeNode)],
      })
    }
  })
  return issues
}

function findConflictingRouteFiles(routeNodes?: RouteNode[]): string[] | undefined {
  if (!routeNodes) return
  if (routeNodes.length < 2) return
  return routeNodes.map(routeNode => routeNode.modulePaths.get('page')!)
}

/** Runs relational validation between routes sharing the same URL position. */
export function validateSearchTree(searchTree: SearchNode): RouteIssue[] {
  const issues: RouteIssue[] = []

  forEachSearchNode(searchTree, (searchNode) => {
    const validation = searchNode.validation
    const pageConflicts = findConflictingRouteFiles(validation?.pages)
    if (pageConflicts) {
      issues.push({
        rule: 'duplicate-page-route',
        severity: 'error',
        message: 'multiple pages resolve to the same URL pattern',
        files: pageConflicts,
      })
    }
    const catchallConflicts = findConflictingRouteFiles(validation?.catchalls)
    if (catchallConflicts) {
      issues.push({
        rule: 'duplicate-catchall-route',
        severity: 'error',
        message: 'multiple catch-all pages resolve to the same URL pattern',
        files: catchallConflicts,
      })
    }
    const dynamicRoutes = validation?.dynamics
    if (dynamicRoutes && dynamicRoutes.size > 1) {
      const params = [...dynamicRoutes.keys()]
      issues.push({
        rule: 'param-name-clash',
        severity: 'error',
        message: `two routes disagree on what to call the same URL parameter: ${params.join(' vs ')}`,
        files: [...dynamicRoutes.values()].map(getDiagnosticPath),
      })
    }
  })
  return issues
}
