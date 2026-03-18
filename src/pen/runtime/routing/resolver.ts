import type { ReactElement } from 'react'
import type { RouteTreeNode, SegmentLayer } from '@/pen/compiler'
import type { DynamicParams } from '../providers/DynamicParamsProvider'
import type { RoutingTable } from './composer'
import { composeSegmentLayerChain } from './composer'
import { NotFoundError } from '../errors'
import { traverse } from '@/lib/tree'

export type RouteResolver = (url: string) => RouteMatch
export type RouteMatch = {
  element: ReactElement
  params?: DynamicParams
}

export function createRouteResolver({ routeTree, pathComponentMap }: RoutingTable): RouteResolver {
  const routeMatchCache: Record<string, RouteMatch> = {}

  return (url) => {
    // 1, Return cached element
    if (routeMatchCache[url])
      return routeMatchCache[url]

    const segments = toSegments(url)
    const { routePath, partial } = matchRoutePath(routeTree, segments)

    // 2. Create element if not cached
    if (!partial) {
      const params = extractParams(routePath, segments)
      const chain = buildSegmentLayerChain(routePath)
      const element = composeSegmentLayerChain(chain, url, pathComponentMap)
      const result: RouteMatch = Object.keys(params).length ? { element, params } : { element }
      return (routeMatchCache[url] = result)
    }

    // No match — walk back from deepest matched node to find nearest ancestor
    // with a not-found boundary, then render that ancestor's chain (screen stripped
    // so NotFoundError is thrown and caught by the boundary).
    for (let i = routePath.length-1; i >= 0; i--) {
      const ancestorChain = buildSegmentLayerChain(routePath.slice(0, i+1))
      if (!ancestorChain.some(layer => layer['not-found']))
        continue

      const params = extractParams(routePath, segments)
      const element = composeSegmentLayerChain(stripScreen(ancestorChain), url, pathComponentMap)
      const match: RouteMatch = Object.keys(params).length ? { element, params } : { element }
      return (routeMatchCache[url] = match)
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
function matchRoutePath(routeTree: RouteTreeNode, segments: string[]) {
  let routePath: RouteTreeNode[] = [routeTree]
  let bestDepth = -1  // -1 assumes exact match is found

  traverse({ idx: 0, path: routePath }, {
    visit: ({ idx, path }) =>
      idx === segments.length && (routePath=path, bestDepth=-1, true),

    expand: ({ idx, path }) => {
      const routeNode = path[path.length-1]!
      const segment = segments[idx]!
      const childFrames = (routeNode.children ?? []).flatMap(child => (
        child.group ?            [{ idx, path:  path.concat(child) }] :
        child.param ?            [{ idx: idx+1, path: path.concat(child) }] :
        child.name === segment ? [{ idx: idx+1, path: path.concat(child) }] : []
      ))

      if (!childFrames.length && idx > bestDepth) {
        const groupChild = routeNode.children?.find(child => child.group)
        routePath = groupChild ? path.concat(groupChild) : path
        bestDepth = idx
      }
      return childFrames
    },
  })

  return { routePath, partial: bestDepth !== -1 }
}

/** Derives dynamic params by walking the matched path and segments together. */
function extractParams(routePath: RouteTreeNode[], segments: string[]): DynamicParams {
  const params: DynamicParams = {}
  let idx = 0
  for (let i=1; i < routePath.length; i++) {  // skip root
    const node = routePath[i]!
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
