  import { traverseDepthFirst } from '@/lib/traversal'
  import type { FileNode } from '@/routing/file-tree'

  export type RouteNode = {
    url: string             // full URL like '/blog/'
    type: 'page' | 'group'  // binary type: 'page' or 'group'
    segment: string         // directory name like 'blog'
    screen?: string         // path to screen.tsx
    layout?: string         // path to layout.tsx
    children?: RouteNode[]
  }

  export function buildRouteTree(fileTree: FileNode): RouteNode | null {
    if (!fileTree.children) return null

    const root: RouteNode = {
      url: '/',
      type: 'page', 
      segment: fileTree.name,
      children: [],
    }
    const routeToFile = new Map([[root, fileTree]]) // map route → file
    const screenRoutes: Record<string, string> = {} // track duplicate screens

    function visit(parentRoute: RouteNode) {
      const parentFile = routeToFile.get(parentRoute)!  // Already populated inside expand
      for (const file of parentFile.children ?? []) {   // Detect layout.tsx and screen.tsx
        switch (file.name) {
          case 'layout.tsx': parentRoute.layout = file.path; break
          case 'screen.tsx': parentRoute.screen = file.path; break
      }}

      // Skip duplicate screen validation if parent route has no screen
      if (!parentRoute.screen) return
      const existingPath = screenRoutes[parentRoute.url]
      
      // Check for duplicate screens
      if (existingPath) throw new Error(
        `Conflicting screen routes found at "${parentRoute.url}":\n` +
        `  1. ${existingPath}/screen.tsx\n` +
        `  2. ${parentFile.path}/screen.tsx\n\n` +
        'Multiple screen.tsx files cannot map to the same URL.\n' +
        'Remove one of the screen.tsx files, or use different route segments.',
      )
      screenRoutes[parentRoute.url] = parentFile.path // Add new screen to map
    }

    function expand(parentRoute: RouteNode) {
      const parentFile = routeToFile.get(parentRoute)!
      if (!parentFile.children) return          // Skip expand if route has no children
      const routes: RouteNode[] = []            // Create container for route children

      for (const file of parentFile.children) {
        if (!file.children) continue            // Skip if file
        if (file.name.startsWith('_')) continue // Skip if private directory
        const segment = file.name
        const isGroup = segment.startsWith('(') && segment.endsWith(')')
        const url = isGroup ? parentRoute.url : `${parentRoute.url}${segment}/`
        const type = isGroup ? 'group' : 'page'

        // This route will always have children since we skipped files
        const route: RouteNode = { url, type, segment, children: [] }
        routeToFile.set(route, file)
        routes.push(route)
      }
      return routes.sort((a, b) => a.segment.localeCompare(b.segment))
    }

    function attach(child: RouteNode, parent: RouteNode) {
      parent.children!.push(child)
    }

    return traverseDepthFirst({ root, visit, expand, attach })
  }
