import type { RouteNode } from './route-tree'
import type { CompileDiagnostic } from './diagnostic'
import { traverse } from '@/lib/traverse'
import { getRouteSource } from './route-tree'
import { forEachReachableRouteNode, getSlotAncestor } from './route-tree'

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

function shouldKeepRouteChild(childRouteNode: RouteNode, isInsideSlot: boolean): boolean {
  const isMalformed = childRouteNode.segment.type === 'malformed'
  const isNestedSlot = isInsideSlot && childRouteNode.segment.type === 'slot'
  return !isMalformed && !isNestedSlot
}

/** Clears a catch-all's children (nothing can nest under one), drops
 *  malformed children outright, and prunes slots nested inside another
 *  slot's subtree (both flagged by validateRouteTree above) - before
 *  expand descends further. */
export function sanitizeRouteTree(routeTree: RouteNode) {
  traverse(routeTree, {
    visit: (routeNode) => {
      const segmentType = routeNode.segment.type
      const isInsideSlot = segmentType === 'slot' || !!getSlotAncestor(routeNode)
      routeNode.children = segmentType !== 'catchall'
        ? routeNode.children.filter(child => shouldKeepRouteChild(child, isInsideSlot))
        : []
    },
    expand: (routeNode) =>
      routeNode.children,
  })
}
