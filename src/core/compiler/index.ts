// Functions
export { createFileTree } from './builders/file-tree'
export { createSegmentTree } from './builders/segment-tree'
export { createRouteManifest } from './builders/route-manifest'
export { createElementTrees } from './builders/element-tree'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'

// Types
export type { FileNode } from './builders/file-tree'
export type { SegmentNode, SegmentRoles } from './builders/segment-tree'
export type { RouteManifest, Route } from './builders/route-manifest'
export type { ElementTree, ElementTreeMap, ComponentMap } from './builders/element-tree'
