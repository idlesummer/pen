  import type { Segment } from './segment'
  import type { RouteModulePaths } from './route-module'
  import { sep } from 'node:path'
  import { treeify } from '@/lib/treeify'
  import { traverse } from '@/lib/traverse'
  import { DEFAULT_FALLBACK_PATH, filterRouteFiles, getRouteModuleType } from './route-module'
  import { createSegment, isPrivate } from './segment'

  export type RouteNode = {
    name: string
    segment: Segment
    path: string
    modules: RouteModulePaths
    default: RouteNode  // itself, or its nearest ancestor that has a default
    // Tree
    parent?: RouteNode
    children: RouteNode[]
    hasPrunedChildren?: true // true when files were dropped during construction (catch-all descendants, or a nested slot)
  }

  function createRouteNode(name: string, path: string): RouteNode {
    const segment = createSegment(name)
    const routeNode = { name, segment, path, modules: {}, children: [] } as unknown as RouteNode  // to reference itself after
    routeNode.default = routeNode
    return routeNode
  }

  /** Visits every route node. */
  export function forEach(root: RouteNode, visit: (routeNode: RouteNode) => void) {
    traverse(root, { visit, expand: routeNode => routeNode.children })
  }

  /** Returns the next non-slot ancestor, or undefined at a slot boundary. */
  export function getNonSlotParent(routeNode: RouteNode): RouteNode | undefined {
    if (routeNode.segment.type !== 'slot')
      return routeNode.parent
  }

  function findDefaultRouteNodeParent(routeNode: RouteNode): RouteNode {
    for (let node: RouteNode | undefined = routeNode; node; node = getNonSlotParent(node))
      if (node.modules.default) return node
    return undefined as never // unreachable - see guarantee above
  }

  /** Builds the route tree from a file list, ensuring its root and slots always
   *  have a `default` module as an inherent tree invariant. */
  export function createRouteTree(filePaths: string[]): RouteNode {
    const routeTree = createRouteNode('', '')
    const routeFilePaths = filterRouteFiles(filePaths)

    treeify(routeTree, routeFilePaths, sep, {
      create: (parentRouteNode, { index, parts, path: filePath }) => {
        const moduleName = parts[index]!    // always defined since `create` only yields existing indices.
        if (index === parts.length-1) // Create the route module if file is last
          parentRouteNode.modules[getRouteModuleType(moduleName)] = filePath

        else if (isPrivate(moduleName))
          return

        else if (parentRouteNode.segment.type === 'catchall') // catch-all must be terminal, drop nesteed routes
          parentRouteNode.hasPrunedChildren = true

        else {
          const segment = createSegment(moduleName)
          if (segment.type === 'slot') {
            const slotNode = getSlotNode(parentRouteNode)
            if (slotNode)  {
              slotNode.hasPrunedChildren = true
              return
            }
          }
          const path = parentRouteNode.path ? `${parentRouteNode.path}/${moduleName}` : moduleName
          return createRouteNode(moduleName, path)
        }
      },
      attach: (child, parent) => {
        child.parent = parent
        parent.children.push(child)
      },
    })
    forEach(routeTree, (node) => {
      if (!node.parent || node.segment.type === 'slot') // ensures a default fallback in each tree
        node.modules.default ??= DEFAULT_FALLBACK_PATH
      node.default = findDefaultRouteNodeParent(node)   // resolves the nearest default route in its ancestor chain
    })
    return routeTree
  }

  /** Finds the nearest slot route node, if any. */
  function getSlotNode(routeNode: RouteNode): RouteNode | undefined {
    for (let node: RouteNode | undefined = routeNode; node; node = node.parent)
      if (node.segment.type === 'slot') return node
  }

  /** Gets the route's source file or falls back to its route path if no module exists. */
  export function getRouteSource(routeNode: RouteNode): string {
    return Object.values(routeNode.modules)[0] ?? routeNode.path
  }

  /** Collects every distinct module path referenced in the tree, sorted. */
  export function getRouteModulePaths(routeTree: RouteNode): string[] {
    const modules = new Set<string>()
    forEach(routeTree, (routeNode) => {
      for (const modulePath of Object.values(routeNode.modules))
        modules.add(modulePath)
    })
    return [...modules].sort()
  }
