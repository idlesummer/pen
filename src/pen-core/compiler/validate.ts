import type { RouteNode } from './route-tree'
import type { PositionConflicts } from './position-node'
import type { Diagnostic } from './diagnostic'
import { createDiagnostic } from './diagnostic'
import { forEach, getRouteSource } from './route-tree'

/** The file a page-conflict diagnostic should name. A folder can own several
 *  modules, so the generic source is not good enough here - the page is what
 *  is actually in conflict. A catch-all folder need not own a page, hence the
 *  fallback. */
function pageSource(routeNode: RouteNode): string {
  return routeNode.modules.page ?? getRouteSource(routeNode)
}

/** The nearest ancestor that is itself a slot, if any. */
function findSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent)
    if (node.type === 'slot') return node
}

/** A param name used twice on one path - the inner binding would shadow the
 *  outer, so neither route can be read unambiguously. */
function findRepeatedParam(routeNode: RouteNode): string | undefined {
  const names = new Set<string>()
  for (let node: RouteNode | undefined = routeNode; node; node = node.parent) {
    const segmentType = node.type
    if (segmentType !== 'dynamic' && segmentType !== 'catchall') continue

    const paramName = node.segment
    if (names.has(paramName)) return paramName
    names.add(paramName)
  }
}

/** Intrinsic issues: everything decidable from one folder and its ancestry.
 *  Reads the route tree and changes nothing, so it can run before or after
 *  compiling - the tree it inspects is the same either way. */
export function validateRouteTree(routeTree: RouteNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  forEach(routeTree, (routeNode) => {
    const segmentType = routeNode.type

    if (segmentType === 'malformed') {
      return void diagnostics.push(createDiagnostic(
        'malformed-segment',
        'error',
        `"${routeNode.name}": ${routeNode.segment}`,
        [getRouteSource(routeNode)],
      ))
    }
    if (segmentType === 'catchall' && routeNode.children.length) {
      diagnostics.push(createDiagnostic(
        'non-terminal-catchall',
        'warn',
        `"${routeNode.path}" is a catch-all route and must be terminal, ` +
        'but has routes nested beneath it that can never be reached',
        [getRouteSource(routeNode)],
      ))
    }
    if (segmentType === 'slot') {
      const slotAncestor = findSlotAncestor(routeNode)
      if (slotAncestor) {
        diagnostics.push(createDiagnostic(
          'nested-slot',
          'error',
          `"${routeNode.path}" is a slot nested inside slot "${slotAncestor.path}" ` +
          '- slot subtrees are terminal and can\'t declare further slots',
          [getRouteSource(routeNode)],
        ))
      }
    }
    if (segmentType === 'dynamic' || segmentType === 'catchall') {
      const paramName = findRepeatedParam(routeNode)
      if (paramName) diagnostics.push(createDiagnostic(
        'repeated-param-name',
        'error',
        `"${paramName}" is used more than once as a dynamic segment name in this route's path`,
        [getRouteSource(routeNode)],
      ))
    }
    if (routeNode.children.some(child => child.type === 'slot') && !routeNode.modules.layout) {
      diagnostics.push(createDiagnostic(
        'slot-without-layout',
        'error',
        `"${routeNode.path}" has a slot but no layout.tsx of its own to render it into ` +
        '- a slot is only ever rendered as a prop passed to a layout, so without one ' +
        'its content can never appear, no matter what matches inside it',
        [getRouteSource(routeNode)],
      ))
    }
  })
  return diagnostics
}

/** Relational issues: only visible once folders have collapsed onto shared
 *  positions, which is why the build collects them as it goes. Route nodes are
 *  kept here rather than on the search node precisely so a diagnostic can name
 *  a file - a position has no file to name. */
export function validateConflicts(conflicts: PositionConflicts[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const { pages, defaults, catchalls, dynamics } of conflicts) {
    if (pages.length > 1) {
      diagnostics.push(createDiagnostic(
        'duplicate-page-route',
        'error',
        'multiple pages resolve to the same URL pattern',
        pages.map(pageSource),
      ))
    }
    if (defaults.size > 1) {
      diagnostics.push(createDiagnostic(
        'duplicate-default-route',
        'error',
        'multiple defaults resolve to the same URL pattern',
        [...defaults].map(getRouteSource),
      ))
    }
    if (catchalls.length > 1) {
      diagnostics.push(createDiagnostic(
        'duplicate-catchall-route',
        'error',
        'multiple catch-all pages resolve to the same URL pattern',
        catchalls.map(pageSource),
      ))
    }
    const paramNames = Object.keys(dynamics)
    if (paramNames.length > 1) {
      diagnostics.push(createDiagnostic(
        'param-name-clash',
        'error',
        `two routes disagree on what to call the same URL parameter: ${paramNames.join(' vs ')}`,
        Object.values(dynamics).map(getRouteSource),
      ))
    }
  }
  return diagnostics
}
