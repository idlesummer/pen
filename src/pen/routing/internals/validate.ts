import { traverse } from '@/pen/lib/traverse'
import Route from './route'
import {
  type FileRouterError,
  MalformedSegmentError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  ConflictingCatchallError,
  ConflictingDynamicSegmentsError,
  SplatIndexConflictError,
  CatchallNotTerminalError,
  RepeatedSlugError,
  OptionalCatchallPageConflictError,
  DuplicateScreenError,
  CrossGroupSlugConflictError,
} from '../errors'

// - Intrinsic -----------------------------------------------------------------------------------------------------------
//
// Every node an intrinsic check needs is reachable by pointer-walking one branch:
// the node's own segment, its own `children`, or its ancestor chain. Group-blind —
// these checks never project to a URL.


/**
 * Validate a single node against its segment, its direct children, and its
 * ancestor chain. Pure — returns findings, mutates nothing.
 *
 * A malformed node reports only its parse error: its subtree is noise and is
 * pruned by the builder, so running further checks here would just add to it.
 */
export function validateIntrinsic(route: Route): FileRouterError[] {
  if (route.segment.type === 'malformed')
    return [new MalformedSegmentError(route.urlPath, route.segment.reason ?? 'malformed segment')]

  return [
    ...validateSiblings(route),
    ...validateTerminal(route),
    ...validateAncestry(route),
  ]
}

/** Same-parent conflicts among a node's direct children. */
function validateSiblings(route: Route): FileRouterError[] {
  const errors: FileRouterError[] = []
  const path = route.urlPath

  const catchalls = route.children.filter(c => c.segment.type === 'catchall')
  const optionals = route.children.filter(c => c.segment.type === 'optional-catchall')
  const dynamics  = route.children.filter(c => c.segment.type === 'dynamic')
  const statics   = route.children.filter(c => c.segment.type === 'static')

  if (catchalls.length > 1)
    errors.push(new DuplicateCatchallError(path))

  if (optionals.length > 1)
    errors.push(new DuplicateOptionalCatchallError(path))

  if (catchalls.length && optionals.length)
    errors.push(new ConflictingCatchallError(path))

  if (dynamics.length > 1)
    errors.push(new ConflictingDynamicSegmentsError(path, dynamics.map(d => d.segment.param!)))

  if (optionals.length && statics.length)
    errors.push(new SplatIndexConflictError(path))

  return errors
}

/** A catch-all / optional-catch-all must be terminal: nothing routable below it. */
function validateTerminal(route: Route): FileRouterError[] {
  const type = route.segment.type
  if (type !== 'catchall' && type !== 'optional-catchall')
    return []

  let hasRoutableDescendant = false
  traverse(route, {
    visit: (node) => {
      if (node !== route && node.modules.page)
        return (hasRoutableDescendant = true) // stop early
    },
    expand: (node) =>
      node.segment.type === 'malformed' ? [] : node.children,
  })

  return hasRoutableDescendant
    ? [new CatchallNotTerminalError(route.urlPath)]
    : []
}

/** Checks against the node's own ancestor chain. */
function validateAncestry(route: Route): FileRouterError[] {
  const errors: FileRouterError[] = []
  const { segment } = route

  // An optional catch-all already matches its parent's base URL.
  if (segment.type === 'optional-catchall' && route.parent?.modules.page)
    errors.push(new OptionalCatchallPageConflictError(route.urlPath))

  // The same slug name may not repeat up the chain.
  if (segment.param)
    for (let ancestor = route.parent; ancestor; ancestor = ancestor.parent)
      if (ancestor.segment.param === segment.param) {
        errors.push(new RepeatedSlugError(route.urlPath, segment.param))
        break
      }

  return errors
}


// - Relational ----------------------------------------------------------------------------------------------------------
//
// A relational check needs a node in another branch, reachable only by projecting
// to a shared URL key (groups erased). Cousins have no pointer path between them —
// only the projected URL reveals the collision.


/**
 * Project routes to normalized URL keys and report cross-branch conflicts that
 * only surface once groups are flattened:
 *
 * - `DuplicateScreenError` — two renderable routes land on the same URL.
 * - `CrossGroupSlugConflictError` — a dynamic URL position uses disagreeing slug
 *   names across groups (e.g. `(a)/[id]` and `(b)/[slug]`). This is the cross-
 *   group half of the slug-name rule; the same-parent half is owned by intrinsic.
 *
 * Same-parent pairs are skipped throughout (intrinsic already reports them), and
 * malformed subtrees are skipped entirely — their URL is meaningless.
 */
export function validateRelational(root: Route): FileRouterError[] {
  const screens = new Map<string, Route[]>() // renderable routes, by full URL
  const slots = new Map<string, Route[]>()   // dynamic segments, by URL position

  traverse(root, {
    visit: (route) => {
      if (route.segment.type === 'malformed') return
      if (route.modules.page) bucket(screens, bucketKey(route), route)
      if (route.segment.type === 'dynamic') bucket(slots, bucketKey(route), route)
    },
    expand: (route) => route.segment.type === 'malformed' ? [] : route.children,
  })

  const errors: FileRouterError[] = []

  for (const [url, routes] of screens)
    for (const [a, b] of crossBranchPairs(routes))
      errors.push(new DuplicateScreenError(url, [a.modules.page!, b.modules.page!]))

  for (const [url, routes] of slots)
    for (const [a, b] of crossBranchPairs(routes))
      if (a.segment.param !== b.segment.param)
        errors.push(new CrossGroupSlugConflictError(url, [a.segment.param!, b.segment.param!], [a.absPath, b.absPath]))

  return errors
}

/** Append a route to the bucket at `key`, creating the bucket on first use. */
function bucket(map: Map<string, Route[]>, key: string, route: Route): void {
  const list = map.get(key) ?? []
  list.push(route)
  map.set(key, list)
}

/**
 * All unordered pairs in a bucket that live in different branches. Same-parent
 * pairs are skipped — those collisions are owned by the intrinsic pass.
 */
function crossBranchPairs(routes: Route[]): [Route, Route][] {
  const pairs: [Route, Route][] = []
  for (let i = 0; i < routes.length; i++)
    for (let j = i + 1; j < routes.length; j++)
      if (routes[i].parent !== routes[j].parent)
        pairs.push([routes[i], routes[j]])
  return pairs
}

/** Project a route to a normalized URL key: groups erased, dynamics generalized. */
function bucketKey(route: Route): string {
  const parts: string[] = []

  for (let node: Route | undefined = route; node; node = node.parent) {
    switch (node.segment.type) {
      case 'group':             break // erased
      case 'dynamic':           parts.push('[*]'); break
      case 'catchall':          parts.push('[...*]'); break
      case 'optional-catchall': parts.push('[[...*]]'); break
      case 'static':            if (node.segment.raw) parts.push(node.segment.raw); break
      // 'malformed' is never bucketed
    }
  }

  return '/' + parts.reverse().join('/')
}
