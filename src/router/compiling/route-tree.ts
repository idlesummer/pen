import type { Segment } from './segment'
import type { RouteModuleType } from './route-module'
import { sep } from 'node:path'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { DEFAULT_FALLBACK_PATH, filterRouteFiles, getRouteModuleType } from './route-module'
import { createSegment, isPrivateSegment } from './segment'

export type RouteNode = {
  name: string
  segment: Segment
  path: string
  modulePaths: Partial<Record<RouteModuleType, string>>
  parent?: RouteNode
  children: RouteNode[]
}

function createRouteNode(name: string, segment: Segment, path: string): RouteNode {
  return { name, segment, path, modulePaths: {}, children: [] }
}

/** Visits every reachable route node, pruning descendants beneath catch-all routes. */
export function forEachReachableRouteNode(root: RouteNode, visit: (routeNode: RouteNode) => void) {
  traverse(root, {
    visit,
    expand: (routeNode) =>
      routeNode.segment.type !== 'catchall' ? routeNode.children : [],
  })
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
  // Add default fallback to the root and every reachable slot
  routeTree.modulePaths.default ??= DEFAULT_FALLBACK_PATH
  forEachReachableRouteNode(routeTree, (node) => {
    if (node.segment.type === 'slot')
      node.modulePaths.default ??= DEFAULT_FALLBACK_PATH
  })
  return routeTree
}

/** Returns the next non-slot ancestor, or undefined at a slot boundary. */
export function getNonSlotParent(routeNode: RouteNode): RouteNode | undefined {
  return routeNode.segment.type !== 'slot' ? routeNode.parent : undefined
}

/** Finds the nearest ancestor route node that is itself a slot, if any. */
export function getSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent)
    if (node.segment.type === 'slot') return node
}

/** Finds the nearest ancestor route node with a default module, skipping slot
 *  boundaries. Always finds one - createRouteTree above guarantees a default
 *  on the root and on every slot, and this walk checks each node before ever
 *  crossing past it, so it can't run out of ancestors to check. */
export function findDefaultRouteNodeParent(routeNode: RouteNode): RouteNode {
  for (let node: RouteNode | undefined = routeNode; node; node = getNonSlotParent(node))
    if (node.modulePaths.default) return node
  return undefined! // unreachable - see guarantee above
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
