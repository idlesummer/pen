// Types
export type { CompiledRoutes } from './types'
export type { FileNode } from './builders/file-tree'
export type { SegmentNode, SegmentRoles } from './builders/segment-tree'
export type { RouteChainMap, Route } from './builders/route-chain-map'
export type { ComponentIdMap } from './builders/component-id-map'
export type { SerializedTree, SerializedRouteTreeMap } from './builders/serialized-routes'

// Functions
export { createFileTree } from './builders/file-tree'
export { createSegmentTree } from './builders/segment-tree'
export { createRouteChainMap } from './builders/route-chain-map'
export { createComponentIdMap } from './builders/component-id-map'
export { createSerializedRoutes } from './builders/serialized-routes'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
