import type { RouteNode } from './route-tree'
import type { PositionConflicts } from './search-tree'
import type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
import { forEach, getRouteSource } from './route-tree'

/** The file a page-conflict diagnostic should name. A folder can own several
 *  modules, so the generic source is not good enough here - the page is what
 *  is actually in conflict. A catch-all folder need not own a page, hence the
 *  fallback. */
function pageSource(routeNode: RouteNode): string {
  return routeNode.modulePaths.page ?? getRouteSource(routeNode)
}

/** The nearest ancestor that is itself a slot, if any. */
function findSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent)
    if (node.segment.type === 'slot') return node
}

/** A param name used twice on one path - the inner binding would shadow the
 *  outer, so neither route can be read unambiguously. */
function findRepeatedParam(routeNode: RouteNode): string | undefined {
  const names = new Set<string>()
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) {
    const segmentType = node.segment.type
    if (segmentType !== 'dynamic' && segmentType !== 'catchall') continue

    const paramName = node.segment.value
    if (names.has(paramName)) return paramName
    names.add(paramName)
  }
}

/** Intrinsic issues: everything decidable from one folder and its ancestry.
 *  Reads the route tree and changes nothing, so it can run before or after
 *  compiling - the tree it inspects is the same either way. */
export function validateRouteTree(routeTree: RouteNode): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []

  forEach(routeTree, (routeNode) => {
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
      const slotAncestor = findSlotAncestor(routeNode)
      if (slotAncestor) {
        diagnostics.push({
          rule: 'nested-slot',
          severity: 'error',
          message:
            `"${routeNode.path}" is a slot nested inside slot "${slotAncestor.path}" ` +
            '- slot subtrees are terminal and can\'t declare further slots',
          files: [getRouteSource(routeNode)],
        })
      }
    }
    if (segmentType === 'dynamic' || segmentType === 'catchall') {
      const paramName = findRepeatedParam(routeNode)
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

/** Relational issues: only visible once folders have collapsed onto shared
 *  positions, which is why the build collects them as it goes. Route nodes are
 *  kept here rather than on the search node precisely so a diagnostic can name
 *  a file - a position has no file to name. */
export function validateConflicts(conflicts: PositionConflicts[]): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []

  for (const { pages, catchalls, dynamics } of conflicts) {
    if (pages.length > 1) {
      diagnostics.push({
        rule: 'duplicate-page-route',
        severity: 'error',
        message: 'multiple pages resolve to the same URL pattern',
        files: pages.map(pageSource),
      })
    }
    if (catchalls.length > 1) {
      diagnostics.push({
        rule: 'duplicate-catchall-route',
        severity: 'error',
        message: 'multiple catch-all pages resolve to the same URL pattern',
        files: catchalls.map(pageSource),
      })
    }
    const paramNames = Object.keys(dynamics)
    if (paramNames.length > 1) {
      diagnostics.push({
        rule: 'param-name-clash',
        severity: 'error',
        message: `two routes disagree on what to call the same URL parameter: ${paramNames.join(' vs ')}`,
        files: Object.values(dynamics).map(getRouteSource),
      })
    }
  }
  return diagnostics
}
