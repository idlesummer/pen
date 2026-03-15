// Types
export type { FileNode } from './builders/file-tree'
export type { SegmentNode, SegmentRoles } from './builders/segment-tree'
export type { RouteChainMap, RouteChain } from './builders/route-chain-map'

// Functions and constants
export { createFileTree } from './builders/file-tree'
export { createSegmentTree, SEGMENT_ROLES } from './builders/segment-tree'
export { createRouteChainMap } from './builders/route-chain-map'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
