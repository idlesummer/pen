import type { ReactElement } from 'react'
import type { RouteTreeNode, SegmentLayer } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { traverse } from '@/lib/tree'
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

  return (url) => {
    // Return match from cache
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const segments = toSegments(url)
    const routePath = matchRoutePath(routeTree, segments)

    // Construct and cache new routes
    if (routePath) {
      const chain = buildChain(routePath.nodes)
      const element = composeChain(chain, url, pathComponentMap)
      const result: RouteMatch = { element }
      if (Object.keys(routePath.params).length) result.params = routePath.params
      return (routeMatchCache[url] = result)
    }

    // No match — walk back from deepest matched node to find nearest ancestor
    // with a not-found boundary, then render that ancestor's chain (screen stripped
    // so NotFoundError is thrown and caught by the boundary).
    const { nodes, params } = deepestPartial(routeTree, segments, 0, {})
    for (let i = nodes.length - 1; i >= 0; i--) {
      const ancestorChain = buildChain(nodes.slice(0, i+1))
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

type MatchResult = { nodes: RouteTreeNode[], params: DynamicParams }

/**
 * Tries to match a URL against the route tree, treating it like a flat route map.
 * Returns the root-to-leaf node sequence and captured params on success, null on miss.
 * Groups are transparent — they are entered without consuming a URL segment.
 */
function matchRoutePath(routeTree: RouteTreeNode, segments: string[]): MatchResult | null {
  let result: MatchResult | null = null
  const frame = { idx: 0, params: {}, nodes: [routeTree] }

  traverse(frame, {
    visit: ({ idx, params, nodes }) => {
      if (idx !== segments.length) return
      result = { nodes, params }
      return true  // stop traversal
    },
    expand: ({ idx, params, nodes }) => {
      const routeNode = nodes[nodes.length-1]!
      const segmentName = segments[idx]!
      const frames: typeof frame[] = []

      for (const child of routeNode.children ?? []) {
        const childNodes = [...nodes, child]
        if (child.group)
          frames.push({ idx, params, nodes: childNodes })                                    // groups don't consume segments
        else if (child.param)
          frames.push({ idx: idx+1, params: { ...params, [child.param]: segmentName }, nodes: childNodes })
        else if (child.name === segmentName)
          frames.push({ idx: idx+1, params, nodes: childNodes })
      }
      return frames
    },
  })

  return result
}

/**
 * Finds the deepest partial match for not-found ancestor resolution.
 * Called only after matchRoutePath returns null. Follows the closest matching
 * child at each level (dynamic preferred over none); appends the first
 * group child when no real child matches so its boundaries stay reachable.
 */
function deepestPartial(node: RouteTreeNode, segments: string[], idx: number, params: DynamicParams): MatchResult {
  if (idx >= segments.length)
    return { nodes: [node], params }

  const urlSeg = segments[idx]!

  for (const child of node.children ?? []) {
    if (child.param) {
      const result = deepestPartial(child, segments, idx + 1, { ...params, [child.param]: urlSeg })
      return { nodes: [node, ...result.nodes], params: result.params }
    }
    if (child.name === urlSeg) {
      const result = deepestPartial(child, segments, idx + 1, params)
      return { nodes: [node, ...result.nodes], params: result.params }
    }
  }

  for (const child of node.children ?? [])
    if (child.group)
      return { nodes: [node, child], params }

  return { nodes: [node], params }
}

// ===== Chain Building =====

/**
 * Converts a root-to-leaf node sequence into a leaf-to-root chain of SegmentLayer.
 * Screens are stripped from all non-leaf nodes (only the leaf's screen renders).
 * Nodes with no remaining roles after stripping are omitted from the chain.
 */
function buildChain(nodes: RouteTreeNode[]): SegmentLayer[] {
  const chain: SegmentLayer[] = []
  for (let i = nodes.length - 1; i >= 0; i--) {
    const roles = { ...nodes[i]!.roles ?? {} }
    if (i < nodes.length - 1) delete roles.screen  // only leaf contributes screen
    if (Object.keys(roles).length) chain.push(roles)
  }
  return chain
}

/** Returns a copy of the chain with the screen removed from the first entry. */
function stripScreen(chain: SegmentLayer[]): SegmentLayer[] {
  if (!chain.length) return chain
  const { screen: _, ...rest } = chain[0]!
  return [rest, ...chain.slice(1)]
}

/** Splits a URL into its path segments, expecting leading and trailing slashes (e.g. `/users/42/`). */
function toSegments(url: string): string[] {
  const inner = url.slice(1, -1)  // strip leading and trailing slashes
  return inner ? inner.split('/') : []
}
