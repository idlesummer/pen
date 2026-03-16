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

  return (url: string): RouteMatch => {
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const { path, params, fullMatch } = walkRouteTree(routeTree, url)

    if (fullMatch) {
      const chain = buildChain(path)
      const element = composeChain(chain, url, pathComponentMap)
      const result: RouteMatch = { element }
      if (Object.keys(params).length) result.params = params
      return (routeMatchCache[url] = result)
    }

    // No full match — walk back from deepest matched node to find nearest ancestor
    // with a not-found boundary, then render that ancestor's chain (screen stripped
    // so NotFoundError is thrown and caught by the boundary).
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
}

// ===== Tree Walk =====

type WalkResult = {
  path: RouteTreeNode[]    // root-to-leaf matched path
  params: DynamicParams
  fullMatch: boolean
}

/**
 * Walks the route tree segment-by-segment to match a URL.
 *
 * Returns the full matched path when all URL segments resolve to a leaf node
 * with a screen, or the deepest partial path otherwise.
 *
 * Groups (segment names wrapped in parentheses) are transparent — they
 * participate in the ancestor chain but do not consume URL segments.
 */
function walkRouteTree(root: RouteTreeNode, url: string): WalkResult {
  const segments = toSegments(url)

  // Attempt a full match — returns the complete root-to-leaf path or null
  function tryFull(
    node: RouteTreeNode,
    idx: number,
    params: DynamicParams,
  ): { path: RouteTreeNode[], params: DynamicParams } | null {
    if (idx === segments.length)
      return { path: [node], params }

    const urlSeg = segments[idx]!

    for (const child of node.children ?? []) {
      let result: ReturnType<typeof tryFull> = null

      if (isGroup(child)) {
        result = tryFull(child, idx, params)  // groups don't consume segments
      } else if (child.param) {
        result = tryFull(child, idx + 1, { ...params, [child.param]: urlSeg })
      } else if (child.name === urlSeg) {
        result = tryFull(child, idx + 1, params)
      }

      if (result) return { path: [node, ...result.path], params: result.params }
    }

    return null
  }

  const full = tryFull(root, 0, {})
  if (full) return { ...full, fullMatch: true }

  // No full match — find deepest partial match for not-found ancestor resolution
  function deepestPartial(
    node: RouteTreeNode,
    idx: number,
    params: DynamicParams,
  ): { path: RouteTreeNode[], params: DynamicParams } {
    if (idx >= segments.length) return { path: [node], params }

    const urlSeg = segments[idx]!

    for (const child of node.children ?? []) {
      if (child.param) {
        const result = deepestPartial(child, idx + 1, { ...params, [child.param]: urlSeg })
        return { path: [node, ...result.path], params: result.params }
      }
      if (child.name === urlSeg) {
        const result = deepestPartial(child, idx + 1, params)
        return { path: [node, ...result.path], params: result.params }
      }
    }

    // No direct child matched — include the first group child in the path so its
    // not-found/error boundaries remain reachable during ancestor resolution.
    for (const child of node.children ?? []) {
      if (isGroup(child)) return { path: [node, child], params }
    }

    return { path: [node], params }
  }

  const partial = deepestPartial(root, 0, {})
  return { ...partial, fullMatch: false }
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
