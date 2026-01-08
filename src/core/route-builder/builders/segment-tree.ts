import { parse } from 'path'
import { traverseDepthFirst } from '@/lib/traversal'
import { RootIsFileError, DuplicateScreenError } from '../errors'
import { type FileNode } from './file-tree'

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
  children?: SegmentNode[]
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
    throw new RootIsFileError(fileTree.path)

  // Special case: Root has "/" as url instead of "/app",
  // and empty segment instead of "app"
  const root: SegmentNode = {
    segment: '',
    url: '/',
    type: 'page',
    roles: {},
    children: [],
  }

  if (!fileTree.children.length) // Early return if root has no children
    return root

  const segmentToFile = new Map([[root, fileTree]]) // map route → file
  const screenSegments: Record<string, string> = {} // track duplicate screens

  function visit(parentSegment: SegmentNode) {
    const parentFile = segmentToFile.get(parentSegment)!  // Already populated inside expand
    if (!parentFile.children?.length) return

    // Step 1: Assign segment role files
    for (const file of parentFile.children) {
      const { name, ext }  = parse(file.name)
      if (ext !== '.tsx')
        continue

      switch (name) {
        case 'screen': parentSegment.roles['screen'] = file.path; break
        case 'not-found': parentSegment.roles['not-found'] = file.path; break
        case 'error':  parentSegment.roles['error']  = file.path;  break
        case 'layout': parentSegment.roles['layout'] = file.path; break
      }
    }

    // Step 2: Validate that screen URLs are unique across the entire tree
    if (!parentSegment.roles.screen)
      return  // No screen to validate

    // Check if another screen already claimed this URL
    const existingFilePath = screenSegments[parentSegment.url]
    if (existingFilePath)
      throw new DuplicateScreenError(parentSegment.url, [existingFilePath, parentFile.path])

    screenSegments[parentSegment.url] = parentFile.path
  }

  function expand(parentSegment: SegmentNode) {
    const parentFile = segmentToFile.get(parentSegment)!
    if (!parentFile.children) return  // Skip expand if route has no children

    // Create container for route children
    const segments: SegmentNode[] = []

    for (const file of parentFile.children) {
      if (!file.children) continue            // Skip if file
      if (file.name.startsWith('_')) continue // Skip if private directory
      const name = file.name
      const isGroup = name.startsWith('(') && name.endsWith(')')
      const url = isGroup ? parentSegment.url : `${parentSegment.url}${name}/`
      const type = isGroup ? 'group' : 'page'

      // This segment will always have children since it is a dir (we already skipped files)
      const segment: SegmentNode = { segment: name, url, type, roles: {}, children: [] }
      segmentToFile.set(segment, file)
      segments.push(segment)
    }
    return segments.sort((a, b) => a.segment.localeCompare(b.segment))
  }

  return traverseDepthFirst({ root, visit, expand, attach: (c, p) => p.children!.push(c) })
}
