import { parse, posix } from 'path'
import { traverseDepthFirst } from '@/lib/tree-utils'
import { RootIsFileError, DuplicateScreenError } from '../errors'
import type { FileNode } from './file-tree'

export type SegmentRoles = {
  'layout'?: string
  'screen'?: string
  'error'?: string
  'not-found'?: string
}

export type SegmentNode = {
  segment: string // directory name
  url: string
  type: 'page' | 'group'
  roles: SegmentRoles
  parent?: SegmentNode
  children?: SegmentNode[]
  file: FileNode
}

/**
 * Builds a segment tree from a file system tree.
 *
 * @param fileTree - File system tree
 * @returns Segment tree with computed URLs and validated structure
 * @throws {RootIsFileError} If the root is a file instead of a directory
 * @throws {DuplicateScreenError} If multiple screens map to the same URL
 */
export function buildSegmentTree(fileTree: FileNode): SegmentNode {
  if (fileTree.children === undefined)
    throw new RootIsFileError(fileTree.absPath)

  // Special case: Root has "/" as url instead of "/app",
  // and empty segment instead of "app"
  const root: SegmentNode = {
    segment: '',
    url: '/',
    type: 'page',
    roles: {},
    children: [],
    file: fileTree,
  }

  // Early return if root has no children
  if (!fileTree.children.length)
    return root

  // For tracking duplicate screens
  const screenSegments: Record<string, string> = {}

  function visit(parentSegment: SegmentNode) {
    const parentFile = parentSegment.file
    if (!parentFile.children?.length) return

    // Step 1: Assign file to segment role
    for (const file of parentFile.children) {
      const { name, ext }  = parse(file.name)
      if (ext !== '.tsx') continue

      switch (name) {
        case 'screen':    parentSegment.roles['screen'] = file.absPath; break
        case 'not-found': parentSegment.roles['not-found'] = file.absPath; break
        case 'error':     parentSegment.roles['error']  = file.absPath;  break
        case 'layout':    parentSegment.roles['layout'] = file.absPath; break
      }
    }

    // Step 2: Validate that screen URLs are unique across the entire tree
    if (!parentSegment.roles.screen)
      return  // No screen to validate

    // Check if another screen already claimed this URL
    const existingFilePath = screenSegments[parentSegment.url]
    if (existingFilePath)
      throw new DuplicateScreenError(parentSegment.url, [existingFilePath, parentFile.absPath])

    screenSegments[parentSegment.url] = parentFile.absPath
  }

  function expand(parentSegment: SegmentNode) {
    const parentFile = parentSegment.file
    if (!parentFile.children) return  // Skip expand if route has no children

    // Create container for route children
    const segments: SegmentNode[] = []

    for (const file of parentFile.children) {
      if (!file.children) continue            // Skip if file (only dirs pass through)
      if (file.name.startsWith('_')) continue // Skip if private directory

      const isGroup = file.name.startsWith('(') && file.name.endsWith(')')
      segments.push({
        segment: file.name,
        url: isGroup ? parentSegment.url : `${posix.join(parentSegment.url, file.name)}/`,
        type: isGroup ? 'group' : 'page',
        roles: {},
        parent: parentSegment,
        children: [],
        file,
      })
    }

    return segments.sort((a, b) => a.segment.localeCompare(b.segment))
  }

  return traverseDepthFirst({
    root,
    visit,
    expand,
    attach: (child, parent) => parent.children!.push(child),
  })
}
