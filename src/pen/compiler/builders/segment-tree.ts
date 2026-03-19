import type { FileNode } from './file-tree'
import { parse } from 'path'
import { traverse } from '@/lib/tree'
import { RootIsFileError, DuplicateScreenError } from '../errors'

export const SEGMENT_ROLES = ['layout', 'screen', 'error', 'not-found'] as const
export type SegmentRole = typeof SEGMENT_ROLES[number]
export type SegmentLayer = Partial<Record<SegmentRole, string>>
export type SegmentNode = {
  route: `${string}/`
  name: string
  param?: string // e.g. "id" from [id], "slug" from [...slug] or [[...slug]]
  type: 'static' | 'group' | 'dynamic' | 'catchall' | 'splat'
  roles?: SegmentLayer
  children?: SegmentNode[]
}

const RANK = {
  group: 0,
  static: 1,
  dynamic: 2,
  catchall: 3,
  splat: 4,
} as const

/**
 * Creates a segment tree from a file system tree.
 *
 * @param fileTree - File system tree
 * @returns Segment tree with assigned roles and validated structure
 * @throws {RootIsFileError} If the root is a file instead of a directory
 * @throws {DuplicateScreenError} If multiple screens map to the same URL
 */
export function createSegmentTree(fileTree: FileNode): SegmentNode {
  if (fileTree.children === undefined)
    throw new RootIsFileError(fileTree.absPath)

  const segmentTree: SegmentNode = { name: '', route: '/', type: 'static' } // special case root
  const screens: Record<SegmentNode['route'], string> = {}
  const nodePair = { fileNode: fileTree, segmentNode: segmentTree }

  traverse(nodePair, {
    visit: ({ fileNode, segmentNode }) => {
      bindFileToSegmentRoles(segmentNode, fileNode)
      validateUniqueScreen(segmentNode, fileNode, screens)
    },
    expand: ({ fileNode, segmentNode }) =>
      (fileNode.children ?? [])
        .filter(file => file.children && !file.name.startsWith('_'))
        .map(file => ({ fileNode: file, segmentNode: createSegmentNode(file, segmentNode.route) }))
        .sort((a, b) =>
          RANK[b.segmentNode.type] - RANK[a.segmentNode.type]
          || b.segmentNode.name.localeCompare(a.segmentNode.name)),

    attach: (child, parent) =>
      (parent.segmentNode.children!.push(child.segmentNode)),
  })

  return segmentTree
}

function bindFileToSegmentRoles(segment: SegmentNode, fileNode: FileNode) {
  for (const child of fileNode.children ?? []) {
    const { name, ext } = parse(child.name) as { name: SegmentRole, ext: string }
    if (ext === '.tsx' && SEGMENT_ROLES.includes(name))
      (segment.roles ??= {})[name] = child.absPath
  }
  segment.children = [] // ensures children field appear last in the object
}

function validateUniqueScreen(segment: SegmentNode, fileNode: FileNode, screens: Record<SegmentNode['route'], string>) {
  if (!segment.roles?.screen) return
  if (screens[segment.route])
    throw new DuplicateScreenError(segment.route, [screens[segment.route]!, fileNode.absPath])
  screens[segment.route] = fileNode.absPath
}

function createSegmentNode(file: FileNode, parentRoute: SegmentNode['route']): SegmentNode {
  const isGroup    = file.name.startsWith('(')    && file.name.endsWith(')')
  const isSplat    = file.name.startsWith('[[...') && file.name.endsWith(']]')
  const isCatchAll = !isSplat && file.name.startsWith('[...') && file.name.endsWith(']')
  const isDynamic  = !isSplat && !isCatchAll && file.name.startsWith('[') && file.name.endsWith(']')

  const param: string | undefined
    = isDynamic  ? file.name.slice(1, -1)
    : isCatchAll ? file.name.slice(4, -1)   // "[...slug]" → "slug"
    : isSplat    ? file.name.slice(5, -2)   // "[[...slug]]" → "slug"
    : undefined

  const type: SegmentNode['type']
    = isGroup    ? 'group'
    : isDynamic  ? 'dynamic'
    : isCatchAll ? 'catchall'
    : isSplat    ? 'splat'
    : 'static'

  const route: SegmentNode['route'] = isGroup ? parentRoute : `${parentRoute}${file.name}/`
  return { name: file.name, route, type, param }
}
