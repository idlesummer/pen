// Types
export type { RouteNode, SegmentLayer, SegmentRole } from './builders/route-tree'
export type { RolesMapping, RoutesBuckets } from './pipeline'

// Functions and constants
export { buildRouteTree, SEGMENT_ROLES } from './builders/route-tree'
export { collectAppFiles, createRolesMapping, normalizeAppPath, createRoutesBuckets } from './pipeline'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
