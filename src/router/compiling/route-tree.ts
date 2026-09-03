import type { Segment } from './segment'
import type { RouteModuleType } from './route-module'
import { sep } from 'node:path'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { DEFAULT_FALLBACK_PATH, filterRouteFiles, getRouteModuleType } from './route-module'
import { createSegment, isPrivateSegment } from './segment'

export type RouteModulePaths = Partial<Record<RouteModuleType, string>>
export type RouteNode = {
  name: string
  segment: Segment
  path: string
  modulePaths: RouteModulePaths
  default: RouteNode // itself, or its nearest ancestor that has a default module - resolved once the whole tree exists, see resolveDefaults
  urlDepth: number    // segments consumed to reach this position - 0 at root, resolved alongside default
  staticness: number  // how static-preferring the path to this node is; higher is better, resolved alongside default
  parent?: RouteNode
  children: RouteNode[]
}

function createRouteNode(name: string, segment: Segment, path: string): RouteNode {
  const node = { name, segment, path, modulePaths: {}, urlDepth: 0, staticness: 0, children: [] } as unknown as RouteNode
  node.default = node // temporary placeholder until resolveDefaults overwrites it
  return node
}

/** Visits every reachable route node, pruning descendants beneath catch-all routes. */
export function forEachReachableRouteNode(root: RouteNode, visit: (routeNode: RouteNode) => void) {
  traverse(root, {
    visit,
    expand: (routeNode) =>
      routeNode.segment.type !== 'catchall' ? routeNode.children : [],
  })
}

/** Returns the next non-slot ancestor, or undefined at a slot boundary. */
export function getNonSlotParent(routeNode: RouteNode): RouteNode | undefined {
  return routeNode.segment.type !== 'slot' ? routeNode.parent : undefined
}

function findDefaultRouteNodeParent(routeNode: RouteNode): RouteNode {
  for (let node: RouteNode | undefined = routeNode; node; node = getNonSlotParent(node))
    if (node.modulePaths.default) return node
  return undefined as never // unreachable - see guarantee above
}

/** Builds the route tree from a file list, then guarantees the root and every
 *  slot always have a `default` module to fall back to - intrinsic to what a
 *  complete route tree provides, not a fixup for anything `validateRouteTree`
 *  flags. */
export function createRouteTree(filePaths: string[]): RouteNode {
  const routeTree = createRouteNode('', createSegment(''), '')
  const routeFilePaths = filterRouteFiles(filePaths)

  treeify(routeTree, routeFilePaths, sep, {
    create: (parentRouteNode, { index, parts, path: filePath }) => {
      const part = parts[index]!    // always defined since `create` only yields existing indices.
      if (index === parts.length-1) // Create the route module if file is last
        parentRouteNode.modulePaths[getRouteModuleType(part)] = filePath

      else if (!isPrivateSegment(part)) {
        const path = parentRouteNode.path ? `${parentRouteNode.path}/${part}` : part
        return createRouteNode(part, createSegment(part), path)
      }
    },
    attach: (child, parent) => {
      child.parent = parent
      parent.children.push(child)
    },
  })
  // One top-down pass: guarantee root/slot fallbacks and resolve each node's
  // own default, urlDepth, and staticness in the same visit. All three are
  // safe together - none depends on anything beyond a node's own segment
  // type and its parent's already-resolved values, and forEachReachableRouteNode
  // visits top-down, so every ancestor (root/slot included) is already
  // resolved by the time a descendant is visited.
  forEachReachableRouteNode(routeTree, (node) => {
    if (!node.parent || node.segment.type === 'slot')
      node.modulePaths.default ??= DEFAULT_FALLBACK_PATH  // ensures a default fallback in each tree
    node.default = findDefaultRouteNodeParent(node) // resolves the nearest default route in its ancestor chain

    if (node.parent) {
      const { type } = node.segment
      const consumesUrl = type === 'static' || type === 'dynamic' || type === 'catchall'
      node.urlDepth = node.parent.urlDepth + (consumesUrl ? 1 : 0) // slot/group/malformed don't consume url
      node.staticness = node.parent.staticness - (type === 'dynamic' || type === 'catchall' ? 1 : 0)
    }
  })
  return routeTree
}

/** Finds the nearest ancestor route node that is itself a slot, if any. */
export function getSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent)
    if (node.segment.type === 'slot') return node
}

/** Gets the route's source file or falls back to its route path if no module exists. */
export function getRouteSource(routeNode: RouteNode): string {
  return Object.values(routeNode.modulePaths)[0] ?? routeNode.path
}

/** Collects every distinct module path referenced anywhere in the tree, sorted.
 *  Real files are already unique by construction (`createRouteTree` assigns each
 *  to exactly one node), but the `default` sentinel can legitimately repeat
 *  across the root and every slot, so duplicates are collapsed here. */
export function getRouteModulePaths(routeTree: RouteNode): string[] {
  const modulePaths = new Set<string>()
  traverse(routeTree, {
    visit: (routeNode) => {
      for (const modulePath of Object.values(routeNode.modulePaths))
        modulePaths.add(modulePath)
    },
    expand: (routeNode) =>
      routeNode.children,
  })
  return [...modulePaths].sort()
}
