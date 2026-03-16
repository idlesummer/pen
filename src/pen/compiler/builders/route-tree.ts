import type { SegmentNode, SegmentRoles, SegmentRole } from './segment-tree'
import { relative } from 'path'
import { removeExtension } from '@/lib/path-utils'

export type RouteTreeNode = {
  segment: string        // raw directory name: "users", "[id]", "(auth)", ""
  param?: string         // dynamic param name, e.g. "id" from "[id]"
  roles: SegmentRoles    // relativized import paths for layout/screen/error/not-found
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
  const genDir = `${outDir}/generated`
  return convertNode(segmentTree, genDir)
}

function convertNode(node: SegmentNode, genDir: string): RouteTreeNode {
  const roles = relativizeRoles(node.roles, genDir)
  const treeNode: RouteTreeNode = { segment: node.segment, roles }
  if (node.param !== undefined) treeNode.param = node.param
  if (node.children?.length) treeNode.children = node.children.map(c => convertNode(c, genDir))
  return treeNode
}

function relativizeRoles(roles: SegmentRoles, genDir: string): SegmentRoles {
  const result: SegmentRoles = {}
  for (const [name, path] of Object.entries(roles) as [SegmentRole, string][]) {
    const importPath = removeExtension(path)
    const relPath = relative(genDir, importPath).replace(/\\/g, '/')
    result[name] = `${relPath}.js`
  }
  return result
}
