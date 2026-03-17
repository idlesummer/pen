import type { ReactElement } from 'react'
import type { RouteTreeNode, SegmentLayer } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { traverse } from '@/lib/tree'
import { composeSegmentLayerChain } from './composer'
import { NotFoundError } from '../errors'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params?: DynamicParams
}

export function createRouteResolver(routingTable: RoutingTable): RouteResolver {
  const { routeTree, pathComponentMap } = routingTable
  const routeMatchCache: Record<string, RouteMatch> = {}

  return (url) => {
    // 1, Return cached element
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const segments = toSegments(url)
    const routePath = matchRoutePath(routeTree, segments)

    // 2. Create element if not cached
    if (routePath) {
      const params = extractParams(routePath, segments)
      const chain = buildSegmentLayerChain(routePath)
      const element = composeSegmentLayerChain(chain, url, pathComponentMap)
      const result: RouteMatch = { element }
      if (Object.keys(params).length) result.params = params
      return (routeMatchCache[url] = result)
    }

    // No match — walk back from deepest matched node to find nearest ancestor
    // with a not-found boundary, then render that ancestor's chain (screen stripped
    // so NotFoundError is thrown and caught by the boundary).
    const partialPath = deepestPartial(routeTree, segments, 0)
    for (let i = partialPath.length - 1; i >= 0; i--) {
      const ancestorChain = buildSegmentLayerChain(partialPath.slice(0, i + 1))
      if (ancestorChain.some(layer => layer['not-found'])) {
        const params = extractParams(partialPath, segments)
        const element = composeSegmentLayerChain(stripScreen(ancestorChain), url, pathComponentMap)
        const result: RouteMatch = { element }
        if (Object.keys(params).length) result.params = params
        return (routeMatchCache[url] = result)
      }
    }

    throw new NotFoundError(url)
  }
}

// ===== Tree Walk =====

/**
 * Tries to match a URL against the route tree, treating it like a flat route map.
 * Returns the root-to-leaf node sequence on success, null on miss.
 * Groups are transparent — they are entered without consuming a URL segment.
 */
function matchRoutePath(routeTree: RouteTreeNode, segments: string[]): RouteTreeNode[] | null {
  let routePath: RouteTreeNode[] | null = null
  const frame = { idx: 0, path: [routeTree] }

  traverse(frame, {
    visit: ({ idx, path }) =>
      (idx === segments.length) && (routePath = path, true),

    expand: ({ idx, path }) => {
      const routeNode = path[path.length-1]!
      const segmentName = segments[idx]!
      const frames: typeof frame[] = []

      for (const child of routeNode.children ?? []) {
        const newPath = [...path, child]
        if (child.group)
          frames.push({ idx, path: newPath })               // groups don't consume segments
        else if (child.name === segmentName || child.param) // if static or dynamic match
          frames.push({ idx: idx+1, path: newPath })
      }
      return frames
    },
  })

  return routePath
}

/**
 * Finds the deepest partial match for not-found ancestor resolution.
 * Called only after matchRoutePath returns null. Follows the closest matching
 * child at each level (dynamic preferred over none); appends the first
 * group child when no real child matches so its boundaries stay reachable.
 */
function deepestPartial(node: RouteTreeNode, segments: string[], idx: number): RouteTreeNode[] {
  if (idx >= segments.length)
    return [node]

  const urlSeg = segments[idx]!

  for (const child of node.children ?? []) {
    if (child.param)
      return [node, ...deepestPartial(child, segments, idx + 1)]
    if (child.name === urlSeg)
      return [node, ...deepestPartial(child, segments, idx + 1)]
  }

  for (const child of node.children ?? [])
    if (child.group)
      return [node, child]

  return [node]
}

/** Derives dynamic params by walking the matched path and segments together. */
function extractParams(nodes: RouteTreeNode[], segments: string[]): DynamicParams {
  const params: DynamicParams = {}
  let idx = 0
  for (let i = 1; i < nodes.length; i++) {  // skip root
    const node = nodes[i]!
    if (node.group) continue
    if (node.param) params[node.param] = segments[idx]!
    idx++
  }
  return params
}

// ===== Chain Building =====

/**
 * Converts a root-to-leaf node sequence into a leaf-to-root chain of SegmentLayer.
 * Screens are stripped from all non-leaf nodes (only the leaf's screen renders).
 * Nodes with no remaining roles after stripping are omitted from the chain.
 */
function buildSegmentLayerChain(routePath: RouteTreeNode[]): SegmentLayer[] {
  const chain: SegmentLayer[] = []

  const leaf = routePath[routePath.length - 1]!
  if (leaf.roles && Object.keys(leaf.roles).length)
    chain.push({ ...leaf.roles })

  for (let i = routePath.length-2; i >= 0; i--) {
    const { screen: _, ...roles } = routePath[i]!.roles ?? {}
    if (Object.keys(roles).length)
      chain.push(roles)
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
