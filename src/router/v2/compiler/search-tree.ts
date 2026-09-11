import type { RouteNode } from './route-tree'
import { dict } from '@/lib/dict'
import { traverse } from '@/lib/traverse'
import { DEFAULT_FALLBACK_PATH } from '@/router/compiling/route-module'
import { isDynamicOrCatchall, isUrlConsuming } from './segment'

/** One folder's wrapping modules - everything it contributes AROUND a page,
 *  never the page itself. A folder earns a Frame only if it wraps something.
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
  slots?: Record<string, SearchNode> // this position's slots, on its anchor folder
  paramDepth: number
}

/** Everything needed to render one accepted position: the complete wrapper
 *  chain, outermost first, and the module at the bottom of it.
 *
 *  The chain is the content owner's own filesystem ancestry, flattened here so
 *  that rendering never walks anything. A fallback's owner can sit ABOVE the
 *  position that matched, in which case its chain is simply shorter - which is
 *  why a fallback never inherits params or slots from the path that failed. */
export type Endpoint = {
  frames: Frame[]
  content: string
  contentDepth: number // match-path index whose params `content` receives
}

/** One URL position: somewhere a URL segment can land. Groups and malformed
 *  folders are transparent and fold into the position around them, so this is
 *  never "a folder".
 *
 *  Every field is a string, a number, or another SearchNode. No RouteNode is
 *  reachable from here, so the route tree cannot be consulted at runtime even
 *  by accident - and is collectable the moment compilation ends. */
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
  fallback: Endpoint  // always present - the default guarantee, resolved here
}

/** Routes that collapsed onto one position. Only detectable once folders have
 *  been collapsed, and deliberately kept OFF SearchNode: it is transient build
 *  state, and SearchNode is meant to be exactly the runtime contract. */
export type PositionConflicts = {
  pages: RouteNode[]                  // every folder claiming a page at this position
  catchalls: RouteNode[]              // every catch-all opened here
  dynamics: Record<string, RouteNode> // param name -> the folder that claimed it
}

export type CompiledSearchTree = {
  root: SearchNode
  conflicts: PositionConflicts[]
}

/** Build-time bookkeeping. All of it is dropped when compilation ends, which
 *  is what lets the route tree be collected. */
type BuildContext = {
  anchorOf: Map<SearchNode, RouteNode>              // position -> the folder that opened it
  positionOf: Map<RouteNode, SearchNode>            // folder -> the position it belongs to
  frameOf: Map<RouteNode, Frame>                    // folder -> its frame, when it wraps anything
  strippedOf: Map<Frame, Frame>                     // frame -> the same frame minus its own default
  slotsOf: Map<SearchNode, Record<string, SearchNode>>
  pageOwnerOf: Map<SearchNode, RouteNode>
  conflictsOf: Map<SearchNode, PositionConflicts>
  insideSlot: Set<RouteNode>                        // folders sitting within a slot subtree
  nodes: SearchNode[]
}

// ── routing rules over the route tree ──────────────────────────────────────
// These stop at slot boundaries, which is a statement about how routing
// inherits rather than about folders - so they live here, not in route-tree.

/** The next ancestor routing inherits from, or nothing at a slot boundary. */
function inheritedParent(routeNode: RouteNode): RouteNode | undefined {
  if (routeNode.type !== 'slot')
    return routeNode.parent
}

/** Visits routeNode and each ancestor routing inherits from, root-ward. */
function forEachAncestor(routeNode: RouteNode, visit: (routeNode: RouteNode) => void) {
  for (let node: RouteNode | undefined = routeNode; node; node = inheritedParent(node))
    visit(node)
}

/** The folder whose `default` covers this position - or, if nothing up the
 *  chain declares one, the boundary itself (the root, or the enclosing slot).
 *  That boundary is where the built-in fallback is used, which is how "every
 *  position renders something" holds without injecting anything into the
 *  route tree. */
function findDefaultOwner(routeNode: RouteNode): RouteNode {
  for (let node = routeNode; ; ) {
    if (node.modules.default) return node
    const parent = inheritedParent(node)
    if (!parent) return node
    node = parent
  }
}

// ── frames ─────────────────────────────────────────────────────────────────

/** Where routing stops inheriting: the app root, and each slot. Both must
 *  always be able to render "nothing claimed this", so both always carry a
 *  default - a real one if declared, the built-in otherwise. v1 planted that
 *  by mutating the route tree; putting it here keeps the guarantee without
 *  touching the parse. */
function isBoundary(routeNode: RouteNode): boolean {
  return routeNode.type === 'root' || routeNode.type === 'slot'
}

function createFrame(routeNode: RouteNode, position: SearchNode): Frame | undefined {
  const { layout, loading, error } = routeNode.modules
  const def = routeNode.modules.default ?? (isBoundary(routeNode) ? DEFAULT_FALLBACK_PATH : undefined)
  if (!layout && !loading && !error && !def)
    return
  return { layout, loading, error, default: def, paramDepth: position.depth }
}

/** The same frame without its own `default` - for an endpoint whose content IS
 *  that default, so it is not also a boundary around itself. */
function stripOwnDefault(frame: Frame): Frame {
  const { layout, loading, error, slots, paramDepth } = frame
  return { layout, loading, error, slots, paramDepth }
}

/** True if a frame still renders something. Slots alone do not: without a
 *  layout there is nothing to pass them to. */
function wraps(frame: Frame): boolean {
  return !!(frame.layout || frame.loading || frame.error || frame.default)
}

// ── positions ──────────────────────────────────────────────────────────────

function conflictsFor(position: SearchNode, ctx: BuildContext): PositionConflicts {
  return ctx.conflictsOf.getOrInsertComputed(position, () => ({ pages: [], catchalls: [], dynamics: dict() }))
}

function createSearchNode(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const { type, segment } = routeNode
  const node: SearchNode = {
    urlDepth: parent.urlDepth + +isUrlConsuming(type),
    staticness: parent.staticness - +isDynamicOrCatchall(type),
    depth: parent.depth + 1,
    fallback: undefined as never, // filled by resolveEndpoints, once every position exists
  }
  if (isDynamicOrCatchall(type))
    node.param = segment
  if (type === 'catchall')
    node.isCatchall = true

  ctx.anchorOf.set(node, routeNode)
  ctx.nodes.push(node)
  return node
}

/** Opens the position a URL-consuming folder lands on, or returns the one
 *  already there - `blog/(a)/docs` and `blog/(b)/docs` are the same URL, so
 *  they share a position. Chains are unaffected either way, since each is
 *  built from its own content owner's ancestry rather than from the position. */
function openPosition(routeNode: RouteNode, parent: SearchNode, ctx: BuildContext): SearchNode {
  const { type, segment } = routeNode

  switch (type) {
    case 'static': {
      const statics = parent.statics ??= dict<SearchNode>()
      return statics[segment] ??= createSearchNode(routeNode, parent, ctx)
    }
    case 'dynamic': {
      conflictsFor(parent, ctx).dynamics[segment] ??= routeNode
      return parent.dynamic ??= createSearchNode(routeNode, parent, ctx)
    }
    default: {
      conflictsFor(parent, ctx).catchalls.push(routeNode)
      return parent.catchall ??= createSearchNode(routeNode, parent, ctx)
    }
  }
}

/** Opens a declared slot, registering it on the POSITION rather than on the
 *  folder - a slot inside a group belongs to the position that group folds
 *  into, and lands on that position's layout. A slot roots a match path of its
 *  own (hence `depth` 0) and consumes no URL, so `urlDepth` carries over. */
function openSlot(routeNode: RouteNode, position: SearchNode, ctx: BuildContext): SearchNode {
  const slots = ctx.slotsOf.getOrInsertComputed(position, dict<SearchNode>)
  const existing = slots[routeNode.segment]
  if (existing) return existing // two folders can declare the same slot name; they merge

  const slotNode = createSearchNode(routeNode, position, ctx)
  slotNode.depth = 0
  return slots[routeNode.segment] = slotNode
}

/** Which position a folder belongs to: transparent folders stay in their
 *  parent's, a slot roots its own, everything else opens a URL position. */
function resolvePosition(routeNode: RouteNode, parentPosition: SearchNode, ctx: BuildContext): SearchNode {
  const segmentType = routeNode.type
  if (segmentType === 'group' || segmentType === 'malformed')
    return parentPosition
  if (segmentType === 'slot')
    return openSlot(routeNode, parentPosition, ctx)
  return openPosition(routeNode, parentPosition, ctx)
}

/** The children worth compiling. This replaces the old sanitize pass: rather
 *  than deleting invalid routes from the route tree, the walk declines to
 *  enter them. Diagnostics still see them, because validation reads the tree
 *  independently. */
function expandChildren(routeNode: RouteNode, ctx: BuildContext): RouteNode[] {
  if (routeNode.type === 'catchall')
    return [] // a catch-all is terminal; nothing nested under it is reachable

  const insideSlot = routeNode.type === 'slot' || ctx.insideSlot.has(routeNode)
  return routeNode.children.filter(child =>
    child.type !== 'malformed'                    // an illegal name routes nowhere
    && !(insideSlot && child.type === 'slot'))    // slot subtrees are terminal
}

// ── endpoints ──────────────────────────────────────────────────────────────

/** Flattens a content owner's ancestry into the chain that wraps it - the walk
 *  the render stage would otherwise repeat on every navigation. */
function createEndpoint(owner: RouteNode, content: string, isFallback: boolean, ctx: BuildContext): Endpoint {
  const frames: Frame[] = []
  forEachAncestor(owner, (routeNode) => {
    const frame = ctx.frameOf.get(routeNode)
    if (frame) frames.push(frame)
  })
  frames.reverse() // ancestry walks leafward-to-rootward; chains render outermost first

  // A fallback's innermost frame always carries the very module the endpoint
  // renders, so it would otherwise be a boundary around itself. Memoised:
  // every position resolving to the same owner wants the same stripped frame.
  if (isFallback && frames.length) {
    const last = frames.length - 1
    frames[last] = ctx.strippedOf.getOrInsertComputed(frames[last]!, stripOwnDefault)
  }
  return {
    frames: frames.filter(wraps), // a frame with nothing left to wrap renders nothing
    content,
    contentDepth: ctx.positionOf.get(owner)!.depth,
  }
}

function resolveEndpoints(ctx: BuildContext) {
  for (const node of ctx.nodes) {
    const pageOwner = ctx.pageOwnerOf.get(node)
    if (pageOwner)
      node.page = createEndpoint(pageOwner, pageOwner.modules.page!, false, ctx)

    const defaultOwner = findDefaultOwner(ctx.anchorOf.get(node)!)
    const content = defaultOwner.modules.default ?? DEFAULT_FALLBACK_PATH
    node.fallback = createEndpoint(defaultOwner, content, true, ctx)
  }
}

// ── build ──────────────────────────────────────────────────────────────────

/** Compiles the route tree into the search tree. Every render decision that
 *  does not depend on the URL is settled here.
 *
 *  Returns the root position and the collapse conflicts found on the way -
 *  the only thing here that still refers to route nodes, and the only thing a
 *  diagnostic can point at a file with. */
export function createSearchTree(routeTree: RouteNode): CompiledSearchTree {
  const root: SearchNode = { urlDepth: 0, staticness: 0, depth: 0, fallback: undefined as never }
  const ctx: BuildContext = {
    anchorOf: new Map([[root, routeTree]]),
    positionOf: new Map([[routeTree, root]]), // seeded, so every child can read its parent's
    frameOf: new Map(),
    strippedOf: new Map(),
    slotsOf: new Map(),
    pageOwnerOf: new Map(),
    conflictsOf: new Map(),
    insideSlot: new Set(),
    nodes: [root],
  }

  traverse(routeTree, {
    visit: (routeNode) => { // the folder's own contribution: its frame, and any page it owns
      const position = ctx.positionOf.get(routeNode)!
      const frame = createFrame(routeNode, position)
      if (frame) ctx.frameOf.set(routeNode, frame)

      if (routeNode.modules.page) {
        if (!ctx.pageOwnerOf.has(position)) ctx.pageOwnerOf.set(position, routeNode)
        conflictsFor(position, ctx).pages.push(routeNode)
      }
    },
    expand: routeNode => expandChildren(routeNode, ctx),
    attach: (childRouteNode, parentRouteNode) => { // carries the position down, in place of a parameter
      if (parentRouteNode.type === 'slot' || ctx.insideSlot.has(parentRouteNode))
        ctx.insideSlot.add(childRouteNode)

      const parentPosition = ctx.positionOf.get(parentRouteNode)!
      ctx.positionOf.set(childRouteNode, resolvePosition(childRouteNode, parentPosition, ctx))
    },
  })

  // Slots hang on their position's anchor folder, once every position exists.
  for (const [position, slots] of ctx.slotsOf) {
    const anchor = ctx.anchorOf.get(position)!
    const frame = ctx.frameOf.getOrInsertComputed(anchor, () => ({ paramDepth: position.depth }))
    frame.slots = slots
  }
  resolveEndpoints(ctx)

  return { root, conflicts: [...ctx.conflictsOf.values()] }
}

/** Every module the compiled tree can actually render, for the component map.
 *  Sourced from the search tree rather than the route tree, so a module in a
 *  branch nothing can reach is not emitted as a dead import. */
export function getModulePaths(root: SearchNode): string[] {
  const modules = new Set<string>()
  const collect = (node: SearchNode) => {
    for (const endpoint of [node.page, node.fallback]) {
      if (!endpoint) continue
      modules.add(endpoint.content)
      for (const frame of endpoint.frames) {
        for (const module of [frame.layout, frame.loading, frame.error, frame.default])
          if (module) modules.add(module)
        for (const slot of Object.values(frame.slots ?? {})) collect(slot)
      }
    }
    for (const child of [...Object.values(node.statics ?? {}), node.dynamic, node.catchall])
      if (child) collect(child)
  }
  collect(root)
  return [...modules].sort()
}
