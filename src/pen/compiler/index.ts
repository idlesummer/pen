// Types
export type { RouteNode, SegmentLayer, SegmentRole } from './builders/route-tree'

// Functions and constants
export { buildRouteTree, SEGMENT_ROLES } from './builders/route-tree'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
