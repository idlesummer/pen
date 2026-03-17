import type { SegmentNode, SegmentRole, SegmentRoles  } from './segment-tree'
import { join, relative } from 'path'
import { removeExtension } from '@/lib/path-utils'

export type RouteTreeNode = {
  name: string
  param?: string
  roles?: SegmentRoles
  groupRoles?: SegmentRoles[]       // outer→inner group boundaries wrapping this node
  fallbackGroupRoles?: SegmentRoles  // merged roles of direct group children (for partial-match boundary resolution)
  children?: RouteTreeNode[]
}

/**
 * Builds a route tree from a segment tree.
 *
 * Strips all build-time metadata (FileNode refs, parent pointers, route strings)
 * and rewrites absolute paths to relative `.js` import paths from the generated dir.
 * Route groups are collapsed: their nodes are removed from the tree and their roles
 * are hoisted onto real-segment children as `groupRoles` (for chain building) and
 * onto the parent as `fallbackGroupRoles` (for partial-match not-found resolution).
 * The resulting tree is JSON-serializable and safe for runtime use.
 *
 * @param segmentTree - Segment tree with parent pointers
 * @param outDir - Output directory (to calculate relative import paths)
 */
export function createRouteTree(segmentTree: SegmentNode, outDir: string): RouteTreeNode {
  const genDir = join(outDir, 'generated')
  return buildRouteNode(segmentTree, genDir, [])
}

function buildRouteNode(
  seg: SegmentNode,
  genDir: string,
  groupStack: SegmentRoles[],
): RouteTreeNode {
  const roles = seg.roles ? resolveRoleImports(seg.roles, genDir) : undefined
  const node: RouteTreeNode = { name: seg.name }

  if (roles && Object.keys(roles).length) node.roles = roles
  if (seg.param !== undefined)            node.param = seg.param
  if (groupStack.length)                  node.groupRoles = groupStack

  const { children, fallbackGroupRoles } = buildChildren(seg.children ?? [], genDir)
  if (children.length)                                              node.children = children
  if (fallbackGroupRoles && Object.keys(fallbackGroupRoles).length) node.fallbackGroupRoles = fallbackGroupRoles

  return node
}

type BuildChildrenResult = {
  children: RouteTreeNode[]
  fallbackGroupRoles?: SegmentRoles
}

/**
 * Converts a list of segment nodes into route tree children, collapsing any
 * group nodes: group children are inlined with an updated groupStack, while the
 * group's own roles are merged into the returned fallbackGroupRoles for the parent.
 */
function buildChildren(
  segs: SegmentNode[],
  genDir: string,
  groupStack: SegmentRoles[] = [],
): BuildChildrenResult {
  const children: RouteTreeNode[] = []
  let fallbackGroupRoles: SegmentRoles | undefined

  for (const seg of segs) {
    if (seg.type === 'group') {
      const groupRoles = seg.roles ? resolveRoleImports(seg.roles, genDir) : undefined
      const newStack = groupRoles ? [...groupStack, groupRoles] : groupStack
      if (groupRoles) fallbackGroupRoles = { ...fallbackGroupRoles, ...groupRoles }
      const { children: groupChildren } = buildChildren(seg.children ?? [], genDir, newStack)
      children.push(...groupChildren)
    } else {
      children.push(buildRouteNode(seg, genDir, groupStack))
    }
  }

  return { children, fallbackGroupRoles }
}

function resolveRoleImports(roles: SegmentRoles, genDir: string): SegmentRoles {
  const segmentRoles: SegmentRoles = {}
  for (const [name, path] of Object.entries(roles) as [SegmentRole, string][]) {
    const importPath = removeExtension(path)
    const relPath = relative(genDir, importPath).replace(/\\/g, '/')
    segmentRoles[name] = `${relPath}.js`
  }
  return segmentRoles
}
