import type { SegmentNode, SegmentRole, SegmentRoleChain  } from './segment-tree'
import { join, relative } from 'path'
import { removeExtension } from '@/lib/path-utils'
import { traverse } from '@/lib/tree'

export type RouteTreeNode = {
  name: string           // raw directory name: "users", "[id]", "(auth)", ""
  param?: string         // dynamic param name, e.g. "id" from "[id]"
  group?: true           // true for route groups, e.g. "(auth)" — don't consume URL segments
  roles?: SegmentRoleChain   // relativized import paths for layout/screen/error/not-found
  children?: RouteTreeNode[]
}

/**
 * Builds a route tree from a segment tree.
 *
 * Strips all build-time metadata (FileNode refs, parent pointers, route strings)
 * and rewrites absolute paths to relative `.js` import paths from the generated dir.
 * The resulting tree is JSON-serializable and safe for runtime use.
 *
 * @param segmentTree - Segment tree with parent pointers
 * @param outDir - Output directory (to calculate relative import paths)
 */
export function createRouteTree(segmentTree: SegmentNode, outDir: string): RouteTreeNode {
  const genDir = join(outDir, 'generated')
  const routeTree = createRouteNode(segmentTree, genDir)
  const nodePair = { segmentNode: segmentTree, routeNode: routeTree }

  traverse(nodePair, {
    expand: ({ segmentNode }) =>
      (segmentNode.children ?? []).map(child => ({
        segmentNode: child,
        routeNode: createRouteNode(child, genDir),
      })),
    attach: (child, parent) =>
      (parent.routeNode.children ??= []).push(child.routeNode),
  })

  return routeTree
}

function createRouteNode(segmentNode: SegmentNode, genDir: string): RouteTreeNode {
  const { name, param, roles: segmentRoles } = segmentNode
  const roles = segmentRoles && resolveRoleImports(segmentRoles, genDir)
  const routeNode: RouteTreeNode = { name }

  if (roles && Object.keys(roles).length) routeNode.roles = roles
  if (param !== undefined)                routeNode.param = param
  if (name.startsWith('(') && name.endsWith(')')) routeNode.group = true
  return routeNode
}

function resolveRoleImports (roles: SegmentRoleChain, genDir: string): SegmentRoleChain {
  const segmentRoles: SegmentRoleChain = {}
  for (const [name, path] of Object.entries(roles) as [SegmentRole, string][]) {
    const importPath = removeExtension(path)
    const relPath = relative(genDir, importPath).replace(/\\/g, '/')
    segmentRoles[name] = `${relPath}.js`
  }
  return segmentRoles
}
