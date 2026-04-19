// Types
export type { RouteNode, SegmentLayer, SegmentRole } from './builders/route-tree'
export type { RolesMapping, RoutesBuckets, TransformResult } from './pipeline'

// Pipeline functions (steps 1–4 + transform)
export { collectAppFiles, createRolesMapping, normalizeAppPath, validateAppPaths, createRoutesBuckets, transform } from './pipeline'

// Tree builder (step 5)
export { buildRouteTree, SEGMENT_ROLES } from './builders/route-tree'

// Errors
export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
