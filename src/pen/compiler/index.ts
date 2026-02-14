// Types
export type { CompiledRoutes } from './types'
export type { FileNode } from './builders/file-tree'
export type { SegmentNode, SegmentRoles } from './builders/segment-tree'
export type { RouteMap, Route } from './builders/route-table'
export type { ComponentIndexMap } from './builders/component-map'
export type { SerializedTree, SerializedComponentTreeMap } from './builders/serialized-tree-map'

// Functions
export { createFileTree } from './builders/file-tree'
export { createSegmentTree } from './builders/segment-tree'
export { createRouteMap } from './builders/route-table'
export { createComponentIndexMap } from './builders/component-map'
export { createSerializedComponentTreeMap } from './builders/serialized-tree-map'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
