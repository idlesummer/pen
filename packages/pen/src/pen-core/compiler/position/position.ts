import type { RouteNode } from '@/pen-core/compiler/route'

/** Represents the module folders that wrap a page endpoint. Folders that don't
 *  contribute aren't included. */
export type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
  slots?: Record<string, PositionNode> // this folder's own declared slots
  paramCount: number  // is the number of dynamic parameters before the frame
}

/** Renderable route endpoint containing all the data needed for rendering. */
export type Endpoint = {
  frames: Frame[]     // last frame is the endpoint's parent
  contentPath: string // either page or default
  paramCount: number  // which position's params `contentPath` receives
}

/** Represents a url position in the route tree. Route groups are epsilon
 *  transitions, consuming no URL segments, meaning multiple RouteNodes can share
 *  one PositionNode. */
export type PositionNode = {
  urlDepth: number      // url segments consumed to reach this position
  dynamicCount: number  // dynamic/catchall segments from root to here
  param?: string        // dynamic param/s captured at this position, only for dynamic/catch-all
  // Children
  statics?: Record<string, PositionNode>
  dynamic?: PositionNode
  catchall?: PositionNode
  // Rendering
  endpoint?: Endpoint   // set when a folder in this position owns a page
  fallback: Endpoint    // default fallback endpoint  for failed matches
}

/** Tracks route conflicts after collapsing route groups. */
export type PositionConflicts = {
  pages: RouteNode[]                  // every folder claiming a page at this position
  defaults: Set<RouteNode>            // every distinct folder whose real default reaches here
  dynamics: Record<string, RouteNode> // param name -> the folder that claimed it
  catchalls: RouteNode[]              // every catch-all opened here
}

/** Build-time context shared by traversal and endpoint resolution.
 *  `frameOf/fallbackFrameOf` memoize frames to reuse references instead
 *  of creating duplicate objects. */
export type PositionContext = {
  positionOf: Map<RouteNode, PositionNode>              // route -> the position it belongs to
  pageOwnerOf: Map<PositionNode, RouteNode>
  defaultOwnerOf: Map<PositionNode, RouteNode>
  slotsOf: Map<RouteNode, Record<string, PositionNode>> // route -> its declared slots, by name
  frameOf: Map<RouteNode, Frame>                        // route -> its frame
  fallbackFrameOf: Map<Frame, Frame>                    // frame -> same frame without `default`, memoized for reuse
}
