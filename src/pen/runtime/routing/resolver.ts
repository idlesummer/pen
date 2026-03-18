import type { ReactElement } from 'react'
import type { RouteTreeNode, SegmentLayer } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
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
    const { full: routePath, partial: partialPath } = matchRoutePath(routeTree, segments)

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
 * Groups are transparent — they are entered without consuming a URL segment.
 * Always returns the deepest partial path reached, used for not-found ancestor resolution
 * (appends the first group child at the dead-end so its boundaries stay reachable).
 */
function matchRoutePath(
  routeTree: RouteTreeNode,
  segments: string[],
): { full: RouteTreeNode[] | null; partial: RouteTreeNode[] } {
  let full: RouteTreeNode[] | null = null
  let bestPartial: RouteTreeNode[] = [routeTree]
  let bestIdx = -1

  const stack = [{ idx: 0, path: [routeTree] as RouteTreeNode[] }]
  while (stack.length) {
    const { idx, path } = stack.pop()!
    const node = path[path.length - 1]!

    if (idx === segments.length) { full = path; break }

    const segmentName = segments[idx]!
    const next: typeof stack = []
    for (const child of node.children ?? []) {
      const newPath = [...path, child]
      if (child.group)
        next.push({ idx, path: newPath })               // groups don't consume segments
      else if (child.name === segmentName || child.param) // static or dynamic match
        next.push({ idx: idx + 1, path: newPath })
    }

    if (!next.length) {
      if (idx > bestIdx) {
        bestIdx = idx
        const groupChild = node.children?.find(c => c.group)
        bestPartial = groupChild ? [...path, groupChild] : path
      }
    } else {
      stack.push(...next)
    }
  }

  return { full, partial: bestPartial }
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
