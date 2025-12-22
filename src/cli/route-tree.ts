// import type { PathNode } from './scanner'

// export type RouteNode = {
//   name: string
//   children?: RouteNode[]
// }

// export type RouteConfig = {
//   ignore?: RegExp
// }

// export function buildRouteTree(node: PathNode, config: RouteConfig): RouteNode | null {
//   // Only process directories
//   if (!node.children) return null
//   if (config.ignore?.test(node.name)) return null
  
//   // Create route node
//   const routeNode: RouteNode = { name: node.name }
//   const childRoutes: RouteNode[] = []
  
//   // Process child directories only (skip files entirely)
//   for (const child of node.children) {
//     if (child.children) {  // Is it a directory?
//       const childRoute = buildRouteTree(child, config)
//       if (childRoute) 
//         childRoutes.push(childRoute)
//     }
//   }
  
//   // Add children if any
//   if (childRoutes.length > 0)
//     routeNode.children = childRoutes
  
//   return routeNode
// }

import { buildTreeDFS } from '@/lib/tree-builder'
import type { PathNode } from '@/cli/path-tree'

export type RouteNode = {
  segment: string
  children?: RouteNode[]

  // Special files
  view?: string
  layout?: string
}

export function buildRouteTree(pathTree: PathNode): RouteNode | null {
  if (!pathTree.children) 
    return null
  
  // Step 1: Create root RouteNode
  const root: RouteNode = { segment: pathTree.name, children: [] }

  // Step 2: Track RouteNode → PathNode mapping (through closures)
  const routeToPath = new Map<RouteNode, PathNode>()
  routeToPath.set(root, pathTree)

  return buildTreeDFS({
    root,

    // Step 3: Expand node into child RouteNodes
    expand: (routeNode) => {
      //  Get source PathNode via closure
      const pathNode = routeToPath.get(routeNode)!
      const pathChildren = pathNode?.children
      if (!pathChildren)
        return null

      // Detect special files and populate routeNode metadata
      for (const pathChild of pathChildren) {
        switch (pathChild.name) {
          case 'layout.tsx': routeNode.layout = pathChild.path; break
          case 'view.tsx':   routeNode.view = pathChild.path; break
        }          
      }

      // Create and return child RouteNodes (directories only)
      const routeChildren = []
      for (const pathChild of pathChildren) {
        if (!pathChild.children)
          continue

        const routeChild: RouteNode = { segment: pathChild.name, children: [] }
        routeToPath.set(routeChild, pathChild)
        routeChildren.push(routeChild)
      }
      return routeChildren.sort((a, b) => a.segment.localeCompare(b.segment))

    },

    // Step 4: Define how to attach children
    attach: (child, parent) => parent.children!.push(child),
  })
}
