// Functions
export { createFileTree } from './builders/file-tree'
export { createSegmentTree } from './builders/segment-tree'
export { createRouteManifest } from './builders/route-manifest'
export { buildComponentEntries } from './builders/component-map'

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
export type { ComponentEntry } from './builders/component-map'
