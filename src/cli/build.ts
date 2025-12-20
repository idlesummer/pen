import type { FileTreeNode } from './scanner'

export type RouteNode = {
  name: string
  children?: RouteNode[]
}

export type RouteConfig = {
  ignore?: RegExp
}

export function buildRouteTree(node: FileTreeNode, config: RouteConfig): RouteNode | null {
  // Only process directories
  if (!node.children) return null
  if (config.ignore?.test(node.name)) return null
  
  // Create route node
  const routeNode: RouteNode = { name: node.name }
  const childRoutes: RouteNode[] = []
  
  // Process child directories only (skip files entirely)
  for (const child of node.children) {
    if (child.children) {  // Is it a directory?
      const childRoute = buildRouteTree(child, config)
      if (childRoute) 
        childRoutes.push(childRoute)
    }
  }
  
  // Add children if any
  if (childRoutes.length > 0)
    routeNode.children = childRoutes
  
  return routeNode
}
