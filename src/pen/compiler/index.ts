// Types
export type { FileNode } from './builders/file-tree'
export type { SegmentNode, SegmentRoleChain } from './builders/segment-tree'
export type { RouteTreeNode } from './builders/route-tree'

// Functions and constants
export { createFileTree } from './builders/file-tree'
export { createSegmentTree, SEGMENT_ROLES } from './builders/segment-tree'
export { createRouteTree } from './builders/route-tree'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
