import type { RouteNode } from './route-tree'
import type { CompileDiagnostic } from './diagnostic'
import { getDiagnosticPath } from './diagnostic'
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
