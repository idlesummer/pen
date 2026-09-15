import type { RouteNode } from './route-tree'

/** One folder's wrapping modules - everything it contributes AROUND a page,
 *  never the page itself. A folder earns a Frame only if it wraps something. */
export type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
}

/** Everything needed to render one accepted position: the complete wrapper
 *  chain, outermost first, and the module at the bottom of it. */
export type Endpoint = {
  frames: Frame[]
  content: string
  contentDepth: number // which position's params `content` receives
}

/** One URL position: somewhere a URL segment can land. Groups fold
 *  transparently into the position around them, so this is never "a folder" -
 *  several RouteNodes can share one SearchNode. */
export type SearchNode = {
  urlDepth: number    // url segments consumed to reach this position
  staticness: number  // how static-preferring the path here is; higher wins
  depth: number        // this position's index in its own match path
  param?: string       // the name this position binds, for dynamic/catch-all
  // Flags
  isCatchall?: true    // accepts even with url segments left over
  // Children
  statics?: Record<string, SearchNode>
  dynamic?: SearchNode
  catchall?: SearchNode
  // Rendering
  endpoint?: Endpoint // set when a folder in this position's territory owns a page
  fallback: Endpoint  // always present - the default guarantee, resolved here
}

/** Routes that collapsed onto one position. Only detectable once folders have
 *  been collapsed, and deliberately kept OFF SearchNode: it is transient build
 *  state, and SearchNode is meant to be exactly the runtime contract. */
export type PositionConflicts = {
  pages: RouteNode[]                  // every folder claiming a page at this position
  defaults: Set<RouteNode>            // every distinct folder whose real default reaches here
  dynamics: Record<string, RouteNode> // param name -> the folder that claimed it
  catchalls: RouteNode[]              // every catch-all opened here
}

/** Build-time bookkeeping, dropped once createSearchTree returns. Shared
 *  between the compiler's two halves - traversal writes all of it, endpoint
 *  resolution only ever reads from it afterward. conflictsOf isn't here: only
 *  the traversal side ever touches it, so it's kept as its own local instead
 *  of bundled into a type the resolve side would carry around unused. The
 *  list of every position isn't here either - that's what drives the resolve
 *  pass's own loop, not something a single position's resolution needs. */
export type SearchContext = {
  positionOf: Map<RouteNode, SearchNode> // folder -> the position it belongs to
  pageOwnerOf: Map<SearchNode, RouteNode>
  defaultOwnerOf: Map<SearchNode, RouteNode>
}
