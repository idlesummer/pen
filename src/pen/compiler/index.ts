// Types
export type { CompiledRoutes } from './types'
export type { FileNode } from './builders/file-tree'
export type { SegmentNode, SegmentRoles } from './builders/segment-tree'
export type { RouteTable, Route } from './builders/route-manifest'
export type { ComponentMap } from './builders/component-map'
export type { ElementTree, ElementTreeMap } from './builders/element-tree'

// Functions
export { createFileTree } from './builders/file-tree'
export { createSegmentTree } from './builders/segment-tree'
export { createRouteTable } from './builders/route-manifest'
export { createComponentMap } from './builders/component-map'
export { createElementTrees } from './builders/element-tree'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
