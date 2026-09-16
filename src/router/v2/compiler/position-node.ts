import type { RouteNode } from './route-tree'

/** One folder's wrapping modules - everything it contributes AROUND a page,
 *  never the page itself. A folder earns a Frame only if it wraps something.
 *
 *  paramDepth is how many params have been bound by the time this frame
 *  renders - it's -staticness, not a position's own depth (see staticness's
 *  comment on PositionNode for why). Without slots every frame in a chain
 *  would share the content's own contentDepth, but a slot can sit between
 *  two dynamic ancestors in the same chain without breaking the param count
 *  that flows through it, so a chain that passes through one can still mix
 *  frames bound at different counts - each frame has to say which one it's
 *  at instead of inheriting one shared value. */
export type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
  slots?: Record<string, PositionNode> // this folder's own declared slots, by name
  paramDepth: number
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
 *  several RouteNodes can share one PositionNode. */
export type PositionNode = {
  urlDepth: number    // url segments consumed to reach this position
  staticness: number  // higher means more static. Negated, it also counts bound params.
  param?: string      // the name this position binds, for dynamic/catch-all
  // Flags
  isCatchall?: true   // accepts even with url segments left over
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
  endpoint?: Endpoint // set when a folder in this position's territory owns a page
  fallback: Endpoint  // always present - the default guarantee, resolved here
}

/** Routes that collapsed onto one position. Only detectable once folders have
 *  been collapsed, and deliberately kept OFF PositionNode: it is transient
 *  build state, and PositionNode is meant to be exactly the runtime contract. */
export type PositionConflicts = {
  pages: RouteNode[]                  // every folder claiming a page at this position
  defaults: Set<RouteNode>            // every distinct folder whose real default reaches here
  dynamics: Record<string, RouteNode> // param name -> the folder that claimed it
  catchalls: RouteNode[]              // every catch-all opened here
}

/** Build-time bookkeeping shared by traversal and endpoint resolution. */
export type PositionContext = {
  positionOf: Map<RouteNode, PositionNode> // folder -> the position it belongs to
  pageOwnerOf: Map<PositionNode, RouteNode>
  defaultOwnerOf: Map<PositionNode, RouteNode>
  slotsOf: Map<RouteNode, Record<string, PositionNode>> // folder -> its declared slots, by name
}
