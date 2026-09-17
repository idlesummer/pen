import type { RouteNode } from './route-tree'

/** One folder's wrapping modules - everything it contributes AROUND a page,
 *  never the page itself. A folder earns a Frame only if it wraps something.
 *
 *  paramDepth is -staticness (see PositionNode), not one shared value per
 *  chain: a slot can sit between two dynamic ancestors without resetting the
 *  param count, so frames on either side of it can be bound at different
 *  counts within the same chain. */
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

/** Build-time bookkeeping shared by traversal and endpoint resolution.
 *  frameOf/fallbackFrameOf share a Frame by reference wherever it repeats,
 *  instead of rebuilding an equal-but-distinct copy on every use. */
export type PositionContext = {
  positionOf: Map<RouteNode, PositionNode> // folder -> the position it belongs to
  pageOwnerOf: Map<PositionNode, RouteNode>
  defaultOwnerOf: Map<PositionNode, RouteNode>
  slotsOf: Map<RouteNode, Record<string, PositionNode>> // folder -> its declared slots, by name
  frameOf: Map<RouteNode, Frame | undefined>            // folder -> its frame, memoised even when it has none
  fallbackFrameOf: Map<Frame, Frame>                    // frame -> the variant used as a fallback's innermost frame
}
