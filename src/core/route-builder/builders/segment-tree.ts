import { parse } from 'path'
import { traverseDepthFirst } from '@/lib/traversal'
import { RootIsFileError, DuplicateScreenError } from '../errors'
import { type FileNode } from './file-tree'

// Constants for routes
export const SEGMENT_EXTENSION = '.tsx' as const
export const SEGMENT_ROLES = ['layout', 'screen', 'error', 'not-found'] as const

export type SegmentRole = typeof SEGMENT_ROLES[number]
export type SegmentRoles = Partial<Record<SegmentRole, string>>
export type SegmentNode = {
  segment: string         // directory name like 'blog'
  url: string             // full URL like '/blog/'
  type: 'page' | 'group'  // binary type: 'page' or 'group'
  roles: SegmentRoles
  children?: SegmentNode[]
}

/**
 * Builds a route tree from a file system tree.
 *
 * Detects layout and screen files, computes URLs, filters private directories,
 * and validates no duplicate screens at the same URL.
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

    // Step 1: Assign route role files
    for (const file of parentFile.children) {
      if (!file.name.endsWith(SEGMENT_EXTENSION)) // Skip non .tsx files
        continue

      const { name } = parse(file.name) // Skip files that arent route roles
      if (!isSegmentRole(name))
        continue
      parentSegment.roles[name] = file.path
    }

    // Step 2: Validate that screen URLs are unique across the entire tree
    if (!parentSegment.roles.screen)
      return

    const existingFilePath = screenSegments[parentSegment.url]
    if (existingFilePath)
      throw new DuplicateScreenError(parentSegment.url, [existingFilePath, parentFile.path])

    screenSegments[parentSegment.url] = parentFile.path
  }

  function expand(parentSegment: SegmentNode) {
    const parentFile = segmentToFile.get(parentSegment)!
    if (!parentFile.children) return          // Skip expand if route has no children
    const routes: SegmentNode[] = []            // Create container for route children

    for (const file of parentFile.children) {
      if (!file.children) continue            // Skip if file
      if (file.name.startsWith('_')) continue // Skip if private directory
      const segment = file.name
      const isGroup = segment.startsWith('(') && segment.endsWith(')')
      const url  = isGroup ? parentSegment.url : `${parentSegment.url}${segment}/`
      const type = isGroup ? 'group' : 'page'

      // This route will always have children since we skipped files
      const route: SegmentNode = { segment, url, type, roles: {}, children: [] }
      segmentToFile.set(route, file)
      routes.push(route)
    }
    return routes.sort((a, b) => a.segment.localeCompare(b.segment))
  }

  function attach(child: SegmentNode, parent: SegmentNode) {
    parent.children!.push(child)
  }

  return traverseDepthFirst({ root, visit, expand, attach })
}

function isSegmentRole(name: string): name is SegmentRole {
  return (SEGMENT_ROLES as readonly string[]).includes(name)
}
