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
      const pathNode = routeToPath.get(routeNode)!  // Always
      const pathChildren = pathNode?.children
      if (!pathChildren) return

      // Detect special files and create child RouteNodes
      const routeChildren: RouteNode[] = []
      for (const pathChild of pathChildren) {
        if (!pathChild.children) {
          // Populate metadata from special files
          switch (pathChild.name) {
            case 'layout.tsx': routeNode.layout = pathChild.path; break
            case 'view.tsx':   routeNode.view = pathChild.path; break
          }
          continue
        }
        // Create RouteNode for directory
        const routeChild: RouteNode = { segment: pathChild.name, children: [] }
        routeToPath.set(routeChild, pathChild)
        routeChildren.push(routeChild)
      }

      routeChildren.sort((a, b) => a.segment.localeCompare(b.segment))
      return routeChildren
    },

    // Step 4: Attach child to parent
    attach: (child, parent) => parent.children!.push(child),
  })
}
