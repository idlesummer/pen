export { buildFileTree } from './builders/file-tree'
export { buildSegmentTree } from './builders/segment-tree'
export { buildRouteManifest } from './builders/route-manifest'
export type { FileNode } from './builders/file-tree'

export {
  FileRouterError,
  DirectoryNotFoundError,
  NotADirectoryError,
  RootIsFileError,
  DuplicateScreenError,
} from './errors'
