import type { ReactElement } from 'react'
import type { RouteTreeNode, SegmentRoles } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { composeChain } from './composer'
import { NotFoundError } from '../errors'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params?: DynamicParams
}

export function createRouteResolver(routingTable: RoutingTable): RouteResolver {
  const { routeTree, pathComponentMap } = routingTable
  const routeMatchCache: Record<string, RouteMatch> = {}  // persisting cache for new matches
  const resolveRoute: RouteResolver = (url) => {
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const segments = toSegments(url)
    const full = tryMatch(routeTree, segments, 0, {})

    if (full) {
      const chain = buildChain(full.path)
      const element = composeChain(chain, url, pathComponentMap)
      const result: RouteMatch = { element }
      if (Object.keys(full.params).length) result.params = full.params
      return (routeMatchCache[url] = result)
    }

    // No full match — walk back from deepest matched node to find nearest ancestor
    // with a not-found boundary, then render that ancestor's chain (screen stripped
    // so NotFoundError is thrown and caught by the boundary).
    const { path, params } = deepestPartial(routeTree, segments, 0, {})
    for (let i = path.length - 1; i >= 0; i--) {
      const ancestorChain = buildChain(path.slice(0, i + 1))
      if (ancestorChain.some(seg => seg['not-found'])) {
        const chainWithoutScreen = stripScreen(ancestorChain)
        const element = composeChain(chainWithoutScreen, url, pathComponentMap)
        const result: RouteMatch = { element }
        if (Object.keys(params).length) result.params = params
        return (routeMatchCache[url] = result)
      }
    }

    throw new NotFoundError(url)
  }

  return resolveRoute
}

// ===== Tree Walk =====

type MatchResult = { path: RouteTreeNode[], params: DynamicParams }

/**
 * Tries to match a URL against the route tree, treating it like a flat route map.
 * Returns the root-to-leaf path and captured params on success, null on miss.
 * Groups are transparent — they are entered without consuming a URL segment.
 */
function tryMatch(node: RouteTreeNode, segments: string[], idx: number, params: DynamicParams): MatchResult | null {
  if (idx === segments.length)
    return { path: [node], params }

  const urlSeg = segments[idx]!

  for (const child of node.children ?? []) {
    let result: MatchResult | null = null

    if (isGroup(child))
      result = tryMatch(child, segments, idx, params)  // groups don't consume segments
    else if (child.param)
      result = tryMatch(child, segments, idx + 1, { ...params, [child.param]: urlSeg })
    else if (child.name === urlSeg)
      result = tryMatch(child, segments, idx + 1, params)

    if (result)
      return { path: [node, ...result.path], params: result.params }
  }

  return null
}

/**
 * Finds the deepest partial match for not-found ancestor resolution.
 * Called only after tryMatch returns null. Follows the closest matching
 * child at each level (dynamic preferred over none); appends the first
 * group child when no real child matches so its boundaries stay reachable.
 */
function deepestPartial(node: RouteTreeNode, segments: string[], idx: number, params: DynamicParams): MatchResult {
  if (idx >= segments.length) return { path: [node], params }

  const urlSeg = segments[idx]!

  for (const child of node.children ?? []) {
    if (child.param) {
      const result = deepestPartial(child, segments, idx + 1, { ...params, [child.param]: urlSeg })
      return { path: [node, ...result.path], params: result.params }
    }
    if (child.name === urlSeg) {
      const result = deepestPartial(child, segments, idx + 1, params)
      return { path: [node, ...result.path], params: result.params }
    }
  }

  for (const child of node.children ?? []) {
    if (isGroup(child)) return { path: [node, child], params }
  }

  return { path: [node], params }
}

// ===== Chain Building =====

/**
 * Converts a root-to-leaf path of tree nodes into a leaf-to-root chain of SegmentRoles.
 * Screens are stripped from all non-leaf nodes (only the leaf's screen renders).
 * Nodes with no remaining roles after stripping are omitted from the chain.
 */
function buildChain(path: RouteTreeNode[]): SegmentRoles[] {
  const chain: SegmentRoles[] = []
  for (let i = path.length - 1; i >= 0; i--) {
    const roles = { ...path[i]!.roles ?? {} }
    if (i < path.length - 1) delete roles.screen  // only leaf contributes screen
    if (Object.keys(roles).length) chain.push(roles)
  }
  return chain
}

/** Returns a copy of the chain with the screen removed from the first entry. */
function stripScreen(chain: SegmentRoles[]): SegmentRoles[] {
  if (!chain.length) return chain
  const { screen: _, ...rest } = chain[0]!
  return [rest, ...chain.slice(1)]
}

function isGroup(node: RouteTreeNode): boolean {
  return node.name.startsWith('(') && node.name.endsWith(')')
}

/** Splits a URL into its path segments, expecting leading and trailing slashes (e.g. `/users/42/`). */
function toSegments(url: string): string[] {
  const inner = url.slice(1, -1)  // strip leading and trailing slashes
  return inner ? inner.split('/') : []
}
