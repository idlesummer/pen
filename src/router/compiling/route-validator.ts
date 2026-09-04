import type { RouteNode } from './route-tree'
import type { CompileDiagnostic } from './compile-diagnostic'
import { traverse } from '@/lib/traverse'
import { getRouteSource } from './route-tree'
import { forEach } from './route-tree'

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

  forEach(root, (routeNode) => {
    const segmentType = routeNode.segment.type

    if (segmentType === 'malformed') {
      return void diagnostics.push({
        rule: 'malformed-segment',
        severity: 'error',
        message: `"${routeNode.name}": ${routeNode.segment.value}`,
        files: [getRouteSource(routeNode)],
      })
    }
    if (segmentType === 'catchall' && routeNode.hasPrunedChildren) {
      diagnostics.push({
        rule: 'non-terminal-catchall',
        severity: 'warning',
        message:
          `"${routeNode.path}" is a catch-all route and must be terminal, ` +
          'but has routes nested beneath it that can never be reached',
        files: [getRouteSource(routeNode)],
      })
    }
    if (segmentType === 'slot' && routeNode.hasPrunedChildren) {
      diagnostics.push({
        rule: 'nested-slot',
        severity: 'error',
        message:
          `"${routeNode.path}" is a slot and can't declare a nested slot ` +
          '- slot subtrees are terminal',
        files: [getRouteSource(routeNode)],
      })
    }
    if (segmentType === 'dynamic' || segmentType === 'catchall') {
      const paramName = findDuplicateParam(routeNode)
      if (paramName) diagnostics.push({
        rule: 'repeated-param-name',
        severity: 'error',
        message: `"${paramName}" is used more than once as a dynamic segment name in this route's path`,
        files: [getRouteSource(routeNode)],
      })
    }
  })
  return diagnostics
}

function isValidRouteChild(childRouteNode: RouteNode): boolean {
  return childRouteNode.segment.type !== 'malformed'
}

/** Drops malformed children outright (flagged by validateRouteTree above)
 *  before expand descends further. Catch-all descendants and nested slots
 *  never get attached in the first place (createRouteTree drops them at
 *  the source), so there's nothing left to clear here for either case. */
export function sanitizeRouteTree(routeTree: RouteNode) {
  traverse(routeTree, {
    visit: (routeNode) => {
      routeNode.children = routeNode.children.filter(isValidRouteChild)
    },
    expand: (routeNode) =>
      routeNode.children,
  })
}
