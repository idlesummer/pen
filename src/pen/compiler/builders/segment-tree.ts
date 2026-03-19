import type { FileNode } from './file-tree'
import { parse } from 'path'
import { traverse } from '@/lib/tree'
import {
  RootIsFileError,
  DuplicateScreenError,
  ConflictingCatchallError,
  DuplicateCatchallError,
  DuplicateSplatError,
  ConflictingDynamicSegmentsError,
  SplatIndexConflictError,
} from '../errors'

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
      validateChildSegmentTypes(segmentNode.children!, fileNode.absPath)
    },
    expand: ({ fileNode, segmentNode }) =>
      (fileNode.children ?? [])
        .filter(file => file.children && !file.name.startsWith('_'))
        .map(file => ({ fileNode: file, segmentNode: createSegmentNode(file, segmentNode.route) }))
        .sort((a, b) => compareSegments(a.segmentNode, b.segmentNode)),

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

function validateChildSegmentTypes(children: SegmentNode[], parentAbsPath: string) {
  const types = children.map(c => c.type)
  if (types.includes('catchall') && types.includes('splat')) throw new ConflictingCatchallError(parentAbsPath)
  if (types.filter(t => t === 'catchall').length > 1)        throw new DuplicateCatchallError(parentAbsPath)
  if (types.filter(t => t === 'splat').length > 1)           throw new DuplicateSplatError(parentAbsPath)

  const params = children.filter(c => c.type === 'dynamic').map(c => c.param!)
  if (new Set(params).size > 1)
    throw new ConflictingDynamicSegmentsError(parentAbsPath, params)
  if (types.includes('splat') && children.some(c => c.type === 'static' && c.name === 'index'))
    throw new SplatIndexConflictError(parentAbsPath)
}

function createSegmentNode({ name }: FileNode, parentRoute: SegmentNode['route']): SegmentNode {
  const type: SegmentNode['type']
    = name.startsWith('(')     && name.endsWith(')')  ? 'group'
    : name.startsWith('[[...') && name.endsWith(']]') ? 'splat'
    : name.startsWith('[...')  && name.endsWith(']')  ? 'catchall'
    : name.startsWith('[')     && name.endsWith(']')  ? 'dynamic'
    : 'static'

  const param
    = type === 'dynamic'  ? name.slice(1, -1)
    : type === 'catchall' ? name.slice(4, -1)
    : type === 'splat'    ? name.slice(5, -2)
    : undefined

  const route: SegmentNode['route'] = type === 'group' ? parentRoute : `${parentRoute}${name}/`
  return { name, route, type, param }
}

const RANK = { group: 0, static: 1, dynamic: 2, catchall: 3, splat: 4 } as const
function compareSegments(a: SegmentNode, b: SegmentNode): number {
  return RANK[b.type] - RANK[a.type] || b.name.localeCompare(a.name)
}
