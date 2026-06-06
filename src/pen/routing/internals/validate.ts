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
 * Bucket every renderable route (those with a `page`) by its projected URL and
 * report cross-branch collisions. Malformed subtrees are skipped: their URL is
 * meaningless and their parse error is already owned by the intrinsic pass.
 */
export function validateRelational(root: Route): FileRouterError[] {
  const buckets = new Map<string, Route[]>()

  traverse(root, {
    visit: (route) => {
      if (route.segment.type === 'malformed') return
      if (!route.modules.page) return
      const key = bucketKey(route)
      const bucket = buckets.get(key) ?? []
      bucket.push(route)
      buckets.set(key, bucket)
    },
    expand: (route) => route.segment.type === 'malformed' ? [] : route.children,
  })

  const errors: FileRouterError[] = []
  for (const [url, routes] of buckets) {
    if (routes.length < 2) continue

    // Report cross-branch pairs only; same-parent collisions belong to intrinsic.
    for (let i = 0; i < routes.length; i++)
      for (let j = i + 1; j < routes.length; j++)
        if (routes[i].parent !== routes[j].parent)
          errors.push(new DuplicateScreenError(url, [routes[i].modules.page!, routes[j].modules.page!]))
  }

  return errors
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
