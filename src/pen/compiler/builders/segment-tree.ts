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
  file: FileNode
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
  const tree = buildSegmentTree(fileTree) // Builds segment tree structure from file tree
  bindSegmentTree(tree)                   // Binds roles to segments and validates tree structure
  return tree
}

function buildSegmentTree(fileTree: FileNode) {
  if (fileTree.children === undefined)
    throw new RootIsFileError(fileTree.absPath)

  const root: SegmentNode = {
    name: '',
    route: '/',
    type: 'page',
    children: [],
    file: fileTree,
  }

  traverse(root, {
    attach: (child, parent) => parent.children!.push(child),
    expand: segment =>
      (segment.file.children ?? [])
        .filter(file => file.children && !file.name.startsWith('_'))
        .map(file => createSegmentNode(file, segment))
        .sort((a, b) => a.name.localeCompare(b.name)),
  })
  return root
}

function bindSegmentTree(segmentTree: SegmentNode) {
  const screens: Record<SegmentNode['route'], string> = {}

  traverse(segmentTree, {
    expand: segment => segment.children ?? [],
    visit: segment => {
      bindFileToSegmentRoles(segment)
      validateScreenUniqueness(segment, screens)
    },
  })
}

function createSegmentNode(file: FileNode, parent: SegmentNode) {
  const isGroup = file.name.startsWith('(') && file.name.endsWith(')')
  const isDynamic = file.name.startsWith('[') && file.name.endsWith(']')
  const param = isDynamic ? file.name.slice(1, -1) : undefined

  let route: SegmentNode['route']
  if (isGroup) route = parent.route
  else if (isDynamic) route = `${parent.route}:${param}/`
  else route = `${posix.join(parent.route, file.name)}/`

  const segmentNode: SegmentNode = {
    name: file.name,
    route,
    type: isGroup ? 'group' : isDynamic ? 'dynamic' : 'page',
    param,
    parent,
    children: [],
    file,
  }
  return segmentNode
}

function bindFileToSegmentRoles(segment: SegmentNode) {
  for (const child of segment.file.children ?? []) {
    const { name, ext } = parse(child.name)
    if (ext !== '.tsx' || !SEGMENT_ROLES.includes(name as SegmentRole))
      continue

    segment.roles ??= {}
    segment.roles[name as SegmentRole] = child.absPath
  }
}

function validateScreenUniqueness(segment: SegmentNode, screens: Record<SegmentNode['route'], string>) {
  if (!segment.roles?.screen) return

  const existing = screens[segment.route]
  if (existing)
    throw new DuplicateScreenError(segment.route, [existing, segment.file.absPath])
  screens[segment.route] = segment.file.absPath
}
