import type { FileNode } from './file-tree'
import { parse, posix } from 'path'
import { traverse } from '@/lib/tree'
import { RootIsFileError, DuplicateScreenError } from '../errors'

export const SEGMENT_ROLES = ['layout', 'screen', 'error', 'not-found'] as const
export type SegmentRole = typeof SEGMENT_ROLES[number]

export type SegmentRoles = Partial<Record<SegmentRole, string>>
export type SegmentNode = {
  route: `${string}/`
  name: string
  param?: string // e.g. "id" from [id]
  type: 'page' | 'group' | 'dynamic'
  roles?: SegmentRoles
  parent?: SegmentNode
  children?: SegmentNode[]
}

type SegmentPair = { fileNode: FileNode, segmentNode: SegmentNode }

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

  const root: SegmentNode = {
    name: '',
    route: '/',
    type: 'page',
    children: [],
  }

  const screens: Record<SegmentNode['route'], string> = {}

  traverse<SegmentPair>({ fileNode: fileTree, segmentNode: root }, {
    expand: ({ fileNode, segmentNode }) =>
      (fileNode.children ?? [])
        .filter(file => file.children && !file.name.startsWith('_'))
        .map(file => ({ fileNode: file, segmentNode: createSegmentNode(file, segmentNode) }))
        .sort((a, b) => a.segmentNode.name.localeCompare(b.segmentNode.name)),
    attach: (child, parent) => parent.segmentNode.children!.push(child.segmentNode),
    visit: ({ fileNode, segmentNode }) => {
      bindFileToSegmentRoles(segmentNode, fileNode)
      validateScreenUniqueness(segmentNode, screens, fileNode)
    },
  })

  return root
}

function createSegmentNode(file: FileNode, parent: SegmentNode): SegmentNode {
  const isGroup = file.name.startsWith('(') && file.name.endsWith(')')
  const isDynamic = file.name.startsWith('[') && file.name.endsWith(']')
  const param = isDynamic ? file.name.slice(1, -1) : undefined

  let route: SegmentNode['route']
  if (isGroup) route = parent.route
  else if (isDynamic) route = `${parent.route}:${param}/`
  else route = `${posix.join(parent.route, file.name)}/`

  return {
    name: file.name,
    route,
    type: isGroup ? 'group' : isDynamic ? 'dynamic' : 'page',
    param,
    parent,
    children: [],
  }
}

function bindFileToSegmentRoles(segment: SegmentNode, fileNode: FileNode) {
  for (const child of fileNode.children ?? []) {
    const { name, ext } = parse(child.name)
    if (ext !== '.tsx' || !SEGMENT_ROLES.includes(name as SegmentRole))
      continue

    segment.roles ??= {}
    segment.roles[name as SegmentRole] = child.absPath
  }
}

function validateScreenUniqueness(segment: SegmentNode, screens: Record<SegmentNode['route'], string>, fileNode: FileNode) {
  if (!segment.roles?.screen) return

  const existing = screens[segment.route]
  if (existing)
    throw new DuplicateScreenError(segment.route, [existing, fileNode.absPath])
  screens[segment.route] = fileNode.absPath
}
