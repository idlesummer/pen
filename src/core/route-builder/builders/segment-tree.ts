import type { FileNode } from './file-tree'
import { parse, posix } from 'path'
import { traverse } from '@/lib/tree'
import { RootIsFileError, DuplicateScreenError } from '../errors'

const ROLES = ['layout', 'screen', 'error', 'not-found'] as const
type Role = typeof ROLES[number]

export type SegmentRoles = Partial<Record<Role, string>>
export type SegmentNode = {
  segment: string
  url: `${string}/`
  type: 'page' | 'group'
  roles: SegmentRoles
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
    segment: '',
    url: '/',
    type: 'page',
    roles: {},
    children: [],
    file: fileTree,
  }

  traverse(root, {
    attach: (child, parent) => parent.children!.push(child),
    expand: segment =>
      (segment.file.children ?? [])
        .filter(file => file.children && !file.name.startsWith('_'))
        .map(file => createSegmentNode(file, segment))
        .sort((a, b) => a.segment.localeCompare(b.segment)),
  })
  return root
}

function bindSegmentTree(segmentTree: SegmentNode) {
  const screens: Record<SegmentNode['url'], string> = {}

  traverse(segmentTree, {
    expand: segment => segment.children ?? [],
    visit: segment => {
      assignRoles(segment)
      validateScreenUniqueness(segment, screens)
    },
  })
}

function createSegmentNode(file: FileNode, parent: SegmentNode) {
  const isGroup = file.name.startsWith('(') && file.name.endsWith(')')
  const segmentNode: SegmentNode = {
    segment: file.name,
    url: isGroup ? parent.url : `${posix.join(parent.url, file.name)}/`,
    type: isGroup ? 'group' : 'page',
    roles: {},
    parent,
    children: [],
    file,
  }
  return segmentNode
}

function assignRoles(segment: SegmentNode) {
  for (const child of segment.file.children ?? []) {
    const { name, ext } = parse(child.name)
    if (ext === '.tsx' && ROLES.includes(name as Role))
      segment.roles[name as Role] = child.absPath
  }
}

function validateScreenUniqueness(segment: SegmentNode, screens: Record<SegmentNode['url'], string>) {
  if (!segment.roles.screen) return

  const existing = screens[segment.url]
  if (existing)
    throw new DuplicateScreenError(segment.url, [existing, segment.file.absPath])
  screens[segment.url] = segment.file.absPath
}
