import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { findDefaultAncestor, forEachAncestor } from './route-tree'
import { isDynamicOrCatchall, isUrlConsuming } from './segment'

/** One folder's renderable modules, resolved at compile time. A folder only
 *  earns a Frame if it actually wraps something - it owns a layout/boundary
 *  module, or it declares slots.
 *
 *  `paramDepth` is the match-path index whose params this frame sees. It is a
 *  property of the folder, not of any one URL: a folder sits at exactly one
 *  position, so a group above an anchor sees the parent's params while the
 *  anchor itself sees its own. */
export type Frame = {
  layout?: string
  loading?: string
  error?: string
  default?: string
  slots?: Record<string, SearchNode> // this position's slots, attached to its anchor folder
  paramDepth: number
}

/** Everything needed to render one accepted position: the complete wrapper
 *  chain, outermost first, and the module at the bottom of it.
 *
 *  The chain is the content owner's own filesystem ancestry, flattened once
 *  here - which is what the render stage used to rebuild per navigation by
 *  walking the route tree alongside the match. Because a fallback's owner can
 *  sit above the position that matched, a fallback chain is simply shorter;
 *  no truncation logic is needed anywhere else. */
export type Endpoint = {
  frames: Frame[]
  content: string
  contentDepth: number // match-path index whose params `content` receives
}

export type SearchValidation = {
  pages?: RouteNode[]                  // every page claimed here, for duplicate-route
  dynamics?: Record<string, RouteNode> // every dynamic name claimed here, for param-name-clash
  catchalls?: RouteNode[]              // every catch-all claimed here, for duplicate-route
}

/** One URL position. Groups and malformed folders are transparent - they fold
 *  into the position around them - so a SearchNode is somewhere a URL segment
 *  can land, never a folder as such.
 *
 *  Nothing here points back at a RouteNode, so the route tree is released once
 *  compilation ends and matching can only read what is stored here. */
export type SearchNode = {
  // Matching
  urlDepth: number    // url segments consumed to reach this position
  staticness: number  // how static-preferring the path here is; higher wins
  depth: number       // this position's index in its own match path (a slot restarts at 0)
  param?: string      // the name this position binds, for dynamic/catch-all
  isCatchall?: true   // accepts even with url segments left over
  statics?: Record<string, SearchNode>
  dynamic?: SearchNode
  catchall?: SearchNode
  // Rendering
  page?: Endpoint     // set when a folder in this position's territory owns a page
  fallback: Endpoint  // always present - the default guarantee, resolved at compile time
  // Validation (dropped by sanitizeSearchTree once diagnostics have run)
  validation?: SearchValidation
}

/** Compile-time bookkeeping, all of it discarded when compilation ends -
 *  which is what lets the route tree be collected. */
type BuildContext = {
  anchorOf: Map<SearchNode, RouteNode>                 // position -> the folder that opened it
  positionOf: Map<RouteNode, SearchNode>               // folder -> the position it belongs to
  frameOf: Map<RouteNode, Frame>                       // folder -> its frame, when it wraps anything
  slotsOf: Map<SearchNode, Record<string, SearchNode>> // position -> the slots declared in it
  pageOwnerOf: Map<SearchNode, RouteNode>              // position -> the folder owning its page
  nodes: SearchNode[]                                  // every position, for validation
}

/** True for a folder that leaves no URL position of its own. */
function isTransparent(routeNode: RouteNode): boolean {
  const segmentType = routeNode.segment.type
  return !!routeNode.parent && (segmentType === 'group' || segmentType === 'malformed')
}

function createFrame(routeNode: RouteNode, position: SearchNode): Frame | undefined {
  const { layout, loading, error, default: def } = routeNode.modulePaths
  if (!layout && !loading && !error && !def)
    return
  return { layout, loading, error, default: def, paramDepth: position.depth }
}

/** Hangs each position's slots on its anchor folder's frame, once every
 *  position is known. A slot needs a layout to be passed to, and the anchor
 *  is the folder whose layout encloses the whole position. */
function attachSlots(ctx: BuildContext) {
  for (const [position, slots] of ctx.slotsOf) {
    const anchor = ctx.anchorOf.get(position)!
    let frame = ctx.frameOf.get(anchor)
    if (!frame) {
      frame = { paramDepth: position.depth }
      ctx.frameOf.set(anchor, frame)
    }
    frame.slots = slots
  }
}

/** True if a frame still renders something. Slots alone do not: without a
 *  layout there is nothing to pass them to. */
function wraps(frame: Frame): boolean {
  return !!(frame.layout || frame.loading || frame.error || frame.default)
}

function createSearchNode(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const segment = routeNode.segment
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(segment),
    staticness: parent.staticness - +isDynamicOrCatchall(segment),
    depth: parent.depth + 1,
    validation: {},
    fallback: undefined as never, // filled in by resolveEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(segment))
    node.param = segment.value
  if (segment.type === 'catchall')
    node.isCatchall = true

  ctx.anchorOf.set(node, routeNode)
  ctx.nodes.push(node)
  return node
}

/** Opens the position a non-transparent folder lands on, or returns the one
 *  already there - `blog/(a)/docs` and `blog/(b)/docs` are the same URL, so
 *  they share a position. Each keeps its own frames regardless, since a chain
 *  is built from the content owner's ancestry rather than from the position. */
function openPosition(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const segment = routeNode.segment

  switch (segment.type) {
    case 'static': {
      const statics = parent.statics ??= dict<SearchNode>()
      return statics[segment.value] ??= createSearchNode(routeNode, parent, ctx)
    }
    case 'dynamic': {
      (parent.validation!.dynamics ??= dict())[segment.value] ??= routeNode
      return parent.dynamic ??= createSearchNode(routeNode, parent, ctx)
    }
    default: {
      (parent.validation!.catchalls ??= []).push(routeNode)
      return parent.catchall ??= createSearchNode(routeNode, parent, ctx)
    }
  }
}

/** Opens the slot positions a folder declares, registering them on the
 *  POSITION rather than the folder - a slot declared inside a group belongs
 *  to the position that group folds into, and lands on that position's
 *  layout. Each slot is the root of its own match path - hence `depth` 0 -
 *  and consumes no URL, so `urlDepth` carries over. */
function openSlots(routeNode: RouteNode, position: SearchNode, ctx: BuildContext) {
  for (const child of routeNode.children) {
    if (child.segment.type !== 'slot') continue

    const slots = ctx.slotsOf.getOrInsertComputed(position, dict<SearchNode>)
    let slotSearchTree = slots[child.segment.value]
    if (!slotSearchTree) { // two folders can declare the same slot name; they merge
      slotSearchTree = createSearchNode(child, position, ctx)
      slotSearchTree.depth = 0 // a slot starts a match path of its own
      slots[child.segment.value] = slotSearchTree
    }
    walk(child, slotSearchTree, ctx)
  }
}

/** Walks one folder: records the position it belongs to and turns it into a
 *  Frame if it wraps anything, then descends. */
function walk(routeNode: RouteNode, position: SearchNode, ctx: BuildContext) {
  openSlots(routeNode, position, ctx)
  const frame = createFrame(routeNode, position)

  ctx.positionOf.set(routeNode, position)
  if (frame) ctx.frameOf.set(routeNode, frame)

  if (routeNode.modulePaths.page) {
    if (!ctx.pageOwnerOf.has(position)) ctx.pageOwnerOf.set(position, routeNode);
    (position.validation!.pages ??= []).push(routeNode)
  }

  for (const child of routeNode.children) {
    if (child.segment.type === 'slot') continue // already opened by openSlots
    walk(child, isTransparent(child) ? position : openPosition(child, position, ctx), ctx)
  }
}

/** Flattens a content owner's ancestry into the chain that wraps it, once,
 *  at compile time. `stripDefault` drops the owner's own default boundary
 *  when that same module is the content - a default rendered inside itself. */
function createEndpoint(owner: RouteNode, content: string, stripDefault: boolean, ctx: BuildContext): Endpoint {
  const frames: Frame[] = []
  forEachAncestor(owner, (routeNode) => {
    const frame = ctx.frameOf.get(routeNode)
    if (frame) frames.push(frame)
  })
  frames.reverse() // forEachAncestor walks leafward-to-rootward; chains render outermost first

  if (stripDefault && frames.length) {
    const last = frames.length - 1
    const { layout, loading, error, slots, paramDepth } = frames[last]! // same frame, minus its default
    frames[last] = { layout, loading, error, slots, paramDepth }
  }
  // A frame with nothing left to wrap renders nothing - drop it here rather
  // than carrying an empty layer through every navigation.
  return {
    frames: frames.filter(wraps),
    content,
    contentDepth: ctx.positionOf.get(owner)!.depth,
  }
}


function resolveEndpoints(ctx: BuildContext) {
  for (const node of ctx.nodes) {
    const pageOwner = ctx.pageOwnerOf.get(node)
    if (pageOwner)
      node.page = createEndpoint(pageOwner, pageOwner.modulePaths.page!, false, ctx)

    const defaultOwner = findDefaultAncestor(ctx.anchorOf.get(node)!)
    node.fallback = createEndpoint(defaultOwner, defaultOwner.modulePaths.default!, true, ctx)
  }
}

/** Compiles the route tree into the search tree. Every render decision that
 *  does not depend on the URL is settled here, so matching never reads a
 *  RouteNode - and the route tree becomes collectable once this returns.
 *
 *  Returns the root position and every position in the tree; the list is for
 *  validation only and is dropped once diagnostics have run. */
export function createSearchTree(routeTree: RouteNode): [SearchNode, SearchNode[]] {
  const root: SearchNode = {
    urlDepth: 0,
    staticness: 0,
    depth: 0,
    validation: {},
    fallback: undefined as never,
  }
  const ctx: BuildContext = {
    anchorOf: new Map([[root, routeTree]]),
    positionOf: new Map(),
    frameOf: new Map(),
    slotsOf: new Map(),
    pageOwnerOf: new Map(),
    nodes: [root],
  }

  walk(routeTree, root, ctx)
  attachSlots(ctx)
  resolveEndpoints(ctx)
  return [root, ctx.nodes]
}
