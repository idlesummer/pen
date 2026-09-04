import type { RouteNode } from './route-tree'
import type { CompileDiagnostic } from './compile-diagnostic'
import { getRouteSource } from './route-tree'
import { forEach } from './route-tree'

/** Finds the nearest ancestor route node that is itself a slot, if any. */
function getSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent)
    if (node.segment.type === 'slot') return node
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
    if (segmentType === 'catchall' && routeNode.children.length) {
      diagnostics.push({
        rule: 'non-terminal-catchall',
        severity: 'warning',
        message:
          `"${routeNode.path}" is a catch-all route and must be terminal, ` +
          'but has routes nested beneath it that can never be reached',
        files: [getRouteSource(routeNode)],
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
          files: [getRouteSource(routeNode)],
        })
      }
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

function isValidRouteChild(childRouteNode: RouteNode, isInsideSlot: boolean): boolean {
  const isMalformed = childRouteNode.segment.type === 'malformed'
  const isNestedSlot = isInsideSlot && childRouteNode.segment.type === 'slot'
  return !isMalformed && !isNestedSlot
}

/** Drops malformed children, clears catch-all descendants, and prunes slots
 *  nested inside another slot's subtree (all flagged by validateRouteTree
 *  above) - before expand descends further, so descendants are dropped in
 *  one pass. */
export function sanitizeRouteTree(routeTree: RouteNode) {
  forEach(routeTree, (routeNode) => {
    if (routeNode.segment.type === 'catchall') { // catch-all must be terminal, drop nested routes
      routeNode.children = []
      return
    }
    const isInsideSlot = routeNode.segment.type === 'slot' || !!getSlotAncestor(routeNode)
    routeNode.children = routeNode.children.filter(child => isValidRouteChild(child, isInsideSlot))
  })
}
