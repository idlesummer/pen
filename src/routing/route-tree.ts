import { traverseDepthFirst } from '@/lib/tree'
import type { PathNode } from '@/routing/path-tree'

export type RouteNode = {
  segment: string
  children?: RouteNode[]

  // Metadata
  isGroup?: boolean

  // Special files
  screen?: string
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

  return traverseDepthFirst({
    root,

    // Step 3: Expand node into child RouteNodes
    expand: (routeNode) => {
      const pathNode = routeToPath.get(routeNode)!  // Always defined
      const pathChildren = pathNode?.children
      if (!pathChildren) return

      // Detect special files and create child RouteNodes
      const routeChildren: RouteNode[] = []
      for (const pathChild of pathChildren) {
        if (!pathChild.children) {
          // Populate metadata from special files
          switch (pathChild.name) {
            case 'layout.tsx': routeNode.layout = pathChild.path; break
            case 'screen.tsx': routeNode.screen = pathChild.path; break
          }
          continue
        }
        // Create RouteNode for directory
        const segment = pathChild.name
        const isGroup = segment.startsWith('(') && segment.endsWith(')')
        const routeChild: RouteNode = { segment, children: [] }

        // Attach metadata
        if (isGroup) routeChild.isGroup = true
        // if (isMeta) routechild.meta = true

        routeChildren.push(routeChild)
        routeToPath.set(routeChild, pathChild)
      }

      routeChildren.sort((a, b) => a.segment.localeCompare(b.segment))
      return routeChildren
    },

    // Step 4: Attach child to parent
    attach: (child, parent) => parent.children!.push(child),
  })
}
