import type { RouteTreeNode } from '@/pen/compiler'
import { traverse } from '@/lib/tree'

/**
 * Matches URL segments against the route tree using DFS.
 * Groups are transparent — entered without consuming a URL segment.
 *
 * On full match: returns the root-to-leaf path with partial=false.
 * On no match: returns the deepest partial path with partial=true,
 * appending the first group child at the dead-end so not-found boundaries stay reachable.
 *
 * @param routeTree - Root node of the route tree
 * @param segments - URL segments to match (e.g. ['users', '42'] from '/users/42/')
 * @returns routePath - Root-to-leaf node sequence,
 *          partial - whether the match is incomplete
 */
export function matchRoutePath(routeTree: RouteTreeNode, segments: string[]) {
  let routePath: RouteTreeNode[] = [routeTree]
  let bestDepth = -1  // -1 assumes exact match is found

  traverse({ idx: 0, path: routePath }, {
    visit: ({ idx, path }) => {
      if (idx !== segments.length)
        return

      routePath = path
      bestDepth = -1
      // Don't short-circuit if this node has an splat child — it should take priority
      // since it provides a screen for the same URL at a deeper, more specific path.
      const routeNode = path[path.length-1]!
      return !(routeNode.children ?? []).some(c => c.type === 'splat')
    },

    expand: ({ idx, path }) => {
      const routeNode = path[path.length-1]!
      const segment = segments[idx]!
      const childFrames = (routeNode.children ?? []).flatMap(child => {
        switch (child.type) {
          case 'static':   return child.name === segment ? [{ idx: idx+1, path: path.concat(child) }] : []
          case 'dynamic':  return [{ idx: idx+1, path: path.concat(child) }]
          case 'catchall': return idx < segments.length ? [{ idx: segments.length, path: path.concat(child) }] : []
          case 'splat':    return [{ idx: segments.length, path: path.concat(child) }]
          case 'group':    return [{ idx, path: path.concat(child) }]
        }
      })
      if (!childFrames.length && idx > bestDepth) { // no children matched and deepest dead end so far
        routePath = path
        bestDepth = idx
      }
      return childFrames
    },
  })

  return { routePath, hasMatch: bestDepth === -1 }
}
