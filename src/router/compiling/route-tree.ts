import type { Segment } from './segment'
import type { RouteModuleType } from './route-module'
import { sep } from 'node:path'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { filterRouteFiles, getRouteModuleType } from './route-module'
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

export function createRouteTree(filePaths: readonly string[]): RouteNode {
  const routeTree = createRouteNode('', createSegment(''), '')
  const routeFilePaths = filterRouteFiles(filePaths)

  treeify(routeTree, routeFilePaths, sep, {
    create: (parentRouteNode, { index, parts, path: filePath }) => {
      const part = parts[index]!      // always defined since `create` only yields existing indices.
      if (index === parts.length-1) { // Create the route module if file is last
        const routeModuleType = getRouteModuleType(part)
        parentRouteNode.modulePaths[routeModuleType] = filePath
      }
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
  return routeTree
}

/** Returns the next non-slot ancestor, or undefined at a slot boundary. */
export function getNonSlotParent(routeNode: RouteNode): RouteNode | undefined {
  if (routeNode.segment.type !== 'slot')
    return routeNode.parent
}

/** Finds the nearest ancestor route node that is itself a slot, if any. */
export function getSlotAncestor(routeNode: RouteNode): RouteNode | undefined {
  for (let node = routeNode.parent; node; node = node.parent) {
    if (node.segment.type === 'slot')
      return node
  }
}

/** Finds the nearest ancestor route node with a default module, skipping slot boundaries. */
export function findDefaultRouteNodeParent(routeNode: RouteNode): RouteNode | undefined {
  for (let node: RouteNode | undefined = routeNode; node; node = getNonSlotParent(node)) {
    if (node.modulePaths.default)
      return node
  }
}

/** Visits every reachable route node, pruning descendants beneath catch-all routes. */
export function forEachReachableRouteNode(root: RouteNode, visit: (routeNode: RouteNode) => void) {
  traverse(root, {
    visit,
    expand: (routeNode) =>
      routeNode.segment.type !== 'catchall' ? routeNode.children : [],
  })
}

/** Gets the route's source file or falls back to its route path if no module exists. */
export function getRouteSource(routeNode: RouteNode): string {
  return Object.values(routeNode.modulePaths)[0] ?? routeNode.path
}

/** Collects every module path referenced anywhere in the tree, sorted. Assumes
 *  `routeTree` came from `createRouteTree` - each file is assigned to exactly
 *  one node's modulePaths there, so paths are already unique by construction. */
export function getRouteModulePaths(routeTree: RouteNode): string[] {
  const modulePaths: string[] = []
  traverse(routeTree, {
    visit: (routeNode) => {
      modulePaths.push(...Object.values(routeNode.modulePaths))
    },
    expand: (routeNode) =>
      routeNode.children,
  })
  return modulePaths.sort()
}
