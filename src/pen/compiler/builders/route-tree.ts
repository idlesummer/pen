import type { SegmentNode, SegmentRoles, SegmentRole } from './segment-tree'
import { relative } from 'path'
import { removeExtension } from '@/lib/path-utils'
import { traverse } from '@/lib/tree'

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

  // traverse works on a single node type, so use a pair to carry both trees in sync
  type Pair = { seg: SegmentNode, tree: RouteTreeNode }

  const root = makeNode(segmentTree, genDir)

  traverse<Pair>({ seg: segmentTree, tree: root }, {
    expand: ({ seg }) => (seg.children ?? []).map(child => ({ seg: child, tree: makeNode(child, genDir) })),
    attach: (child, parent) => (parent.tree.children ??= []).push(child.tree),
  })

  return root
}

function makeNode(node: SegmentNode, genDir: string): RouteTreeNode {
  const treeNode: RouteTreeNode = { segment: node.segment, roles: relativizeRoles(node.roles, genDir) }
  if (node.param !== undefined) treeNode.param = node.param
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
