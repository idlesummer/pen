import type { Segment } from './segment'
import { basename, sep } from 'node:path'
import { treeify } from '@/lib/treeify'
import { traverse } from '@/lib/traverse'
import { createSegment, isPrivateSegment } from './segment'

const ROUTE_MODULE_TYPES =
  new Set(['page', 'layout', 'loading', 'error', 'default'] as const)

export type RouteModuleType = typeof ROUTE_MODULE_TYPES extends Set<infer T> ? T : never
export type RouteNode = {
  name: string
  segment: Segment
  path: string
  modulePaths: Partial<Record<RouteModuleType, string>>
  parent?: RouteNode
  children: RouteNode[]
}

function getRouteModuleType(fileName: string): RouteModuleType {
  return basename(fileName, '.tsx') as RouteModuleType
}

function isRouteFilePath(path: string): boolean {
  const fileName = basename(path)
  const routeModuleType = getRouteModuleType(fileName)
  return fileName.endsWith('.tsx') && ROUTE_MODULE_TYPES.has(routeModuleType)
}

function createRouteNode(name: string, segment: Segment, path: string): RouteNode {
  return { name, segment, path, modulePaths: {}, children: [] }
}

export function createRouteTree(filePaths: string[]): RouteNode {
  const routeNodeRoot = createRouteNode('', createSegment(''), '')
  const routeFilePaths = filePaths.filter(isRouteFilePath)  // ignore non-route-module files

  treeify(routeNodeRoot, routeFilePaths, sep, {
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
  return routeNodeRoot
}

/** The next ancestor to continue climbing to - or undefined if `routeNode`
 *  is itself a slot's own folder, since slots are validated to never nest
 *  and climbing must stop there rather than escape into the owner's tree. */
export function getNonSlotParent(routeNode: RouteNode): RouteNode | undefined {
  if (routeNode.segment.type !== 'slot')
    return routeNode.parent
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
