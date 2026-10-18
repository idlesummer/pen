import type { RouteNode } from './route/route-tree'
import type { Claims } from './position'
import { forEach, getRouteSource } from './route'

// ── diagnostic ─────────────────────────────────────────────────────────

export type Diagnostic = {
  rule: string
  severity: 'error' | 'warn'
  description: string
  files: string[]
  message: string
}

/** Creates a diagnostic with a formatted message. */
function createDiagnostic(diagnostic: Omit<Diagnostic, 'message'>): Diagnostic {
  const { rule, severity, description, files } = diagnostic
  const message = [`[${severity}] ${rule}: ${description}`, ...files.map(file => `  at ${file}`)].join('\n')
  return { ...diagnostic, message }
}

// ── validation ─────────────────────────────────────────────────────────

/** Prefer the page as the diagnostic source or fall back to the route source when absent. */
function pageSource(routeNode: RouteNode): string {
  return routeNode.modules.page ?? getRouteSource(routeNode)
}

/** The nearest ancestor that is a slot. */
function findSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent)
    if (node.type === 'slot') return node
}

/** Finds a repeated param name along a route path. */
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

/** Intrinsic issues: decidable from a folder and its ancestry alone.
 *  Read-only, so validation can run before or after compilation. */
export function validateRouteTree(routeTree: RouteNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  forEach(routeTree, (routeNode) => {
    const segmentType = routeNode.type

    if (segmentType === 'malformed') {
      return void diagnostics.push(createDiagnostic({
        rule: 'malformed-segment',
        severity: 'error',
        description: `"${routeNode.name}": ${routeNode.segment}`,
        files: [getRouteSource(routeNode)],
      }))
    }
    if (segmentType === 'catchall' && routeNode.children.length) {
      diagnostics.push(createDiagnostic({
        rule: 'non-terminal-catchall',
        severity: 'warn',
        description: `"${routeNode.path}" is a catch-all route, which can't contain nested routes`,
        files: [getRouteSource(routeNode)],
      }))
    }
    if (segmentType === 'slot') {
      const slotAncestor = findSlotAncestor(routeNode)
      if (slotAncestor) {
        diagnostics.push(createDiagnostic({
          rule: 'nested-slot',
          severity: 'error',
          description: `"${routeNode.path}" is nested inside slot "${slotAncestor.path}", but slot subtrees can't contain slots`,
          files: [getRouteSource(routeNode)],
        }))
      }
    }
    if (segmentType === 'dynamic' || segmentType === 'catchall') {
      const paramName = findRepeatedParam(routeNode)
      if (paramName) diagnostics.push(createDiagnostic({
        rule: 'repeated-param-name',
        severity: 'error',
        description: `"${paramName}" is used more than once as a dynamic segment name in this route's path`,
        files: [getRouteSource(routeNode)],
      }))
    }
    if (routeNode.children.some(child => child.type === 'slot') && !routeNode.modules.layout) {
      diagnostics.push(createDiagnostic({
        rule: 'slot-without-layout',
        severity: 'error',
        description: `"${routeNode.path}" has a slot but no layout.tsx to render it`,
        files: [getRouteSource(routeNode)],
      }))
    }
  })
  return diagnostics
}

/** Relational issues: only visible after folders collapse onto shared
 *  positions. Keep route nodes so diagnostics can identify source files. */
export function validateConflicts(claims: Claims[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const claim of claims) {
    if (claim.page.length > 1) {
      diagnostics.push(createDiagnostic({
        rule: 'duplicate-page-route',
        severity: 'error',
        description: 'multiple pages resolve to the same URL pattern',
        files: claim.page.map(pageSource),
      }))
    }

    const distinctDefaults = new Set(claim.default)
    if (distinctDefaults.size > 1) {
      diagnostics.push(createDiagnostic({
        rule: 'duplicate-default-route',
        severity: 'error',
        description: 'multiple defaults resolve to the same URL pattern',
        files: [...distinctDefaults].map(getRouteSource),
      }))
    }
    if (claim.catchall.length > 1) {
      diagnostics.push(createDiagnostic({
        rule: 'duplicate-catchall-route',
        severity: 'error',
        description: 'multiple catch-all pages resolve to the same URL pattern',
        files: claim.catchall.map(pageSource),
      }))
    }
    const paramNames = new Set(claim.dynamic.map(r => r.segment))
    if (paramNames.size > 1) {
      diagnostics.push(createDiagnostic({
        rule: 'param-name-clash',
        severity: 'error',
        description: `two routes disagree on what to call the same URL parameter: ${[...paramNames].map(n => `"${n}"`).join(' vs ')}`,
        files: claim.dynamic.map(getRouteSource),
      }))
    }
  }
  return diagnostics
}
