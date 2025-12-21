// import type { FileTreeNode } from './scanner'

// export type RouteNode = {
//   name: string
//   children?: RouteNode[]
// }

// export type RouteConfig = {
//   ignore?: RegExp
// }

// export function buildRouteTree(node: FileTreeNode, config: RouteConfig): RouteNode | null {
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
import type { FileTreeNode } from './file-tree'

export type RouteNode = {
  name: string
  children?: RouteNode[]
}

export type RouteConfig = {
  ignore?: RegExp
}

export function buildRouteTree(fileTree: FileTreeNode, config: RouteConfig): RouteNode | null {
  if (!fileTree.children) return null
  if (config.ignore?.test(fileTree.name)) return null
  
  
  const root: RouteNode = { name: fileTree.name }
  const sourceMap = new Map<RouteNode, FileTreeNode>()  // Map to track RouteNode → FileTreeNode correspondence
  sourceMap.set(root, fileTree)

  return buildTreeDFS<RouteNode, FileTreeNode>({
    root,
    
    expand: (routeNode) => {
      const fileNode = sourceMap.get(routeNode)!
      return fileNode.children || []
    },
    
    createChild: (fileNode) => {
      const child: RouteNode = { name: fileNode.name }
      sourceMap.set(child, fileNode)
      return child
    },
    
    attach: (child, parent) => {
      if (!parent.children) parent.children = []
      parent.children.push(child)
    },
    
    shouldTraverse: (child, fileNode) =>
      !!fileNode.children && !config.ignore?.test(fileNode.name),
  })
}
