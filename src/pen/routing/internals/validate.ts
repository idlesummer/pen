/**
 * Route validation — two passes over the built tree, split by reachability
 * (what a check needs in order to fire). See `docs/routing-validation.md`.
 *
 *   1. Route-tree pass (`validateRouteTree`) — pointer-local rules whose inputs
 *      are all on the node itself or its ancestor chain. These can't move to the
 *      URL tree: a malformed name doesn't project, and slug repetition is a
 *      property of one concrete path.
 *
 *   2. URL-tree pass (`validateUrlTree`) — everything that only surfaces once
 *      groups are flattened. The route tree is projected to a `UrlNode` tree, so
 *      cousins that resolve to the same URL collapse into one node and every
 *      cross-branch rule becomes a local check on a single node.
 *
 * The projection is what makes pass 2 simple: it dissolves the older "intrinsic
 * vs relational" (same-parent vs cross-group) distinction — after projection
 * there is no difference, both are just routes that collapsed into one node.
 */

import { traverse } from '@/pen/lib/traverse'
import Route from './route'
import UrlNode from './url-node'
import {
  type FileRouterError,
  MalformedSegmentError,
  RepeatedSlugError,
  DuplicateScreenError,
  ConflictingDynamicSegmentsError,
  DuplicateCatchallError,
  DuplicateOptionalCatchallError,
  ConflictingCatchallError,
  SplatIndexConflictError,
  OptionalCatchallPageConflictError,
  CatchallNotTerminalError,
} from '../errors'

// - Route-tree checks ---------------------------------------------------------------------------------------------------
//
// Genuinely pointer-local rules: everything they need is the node's own segment
// or its ancestor chain. These can't move to the URL tree — a malformed name
// does not project, and slug repetition is a property of one concrete path.


/** Validate the route tree for pointer-local rules. Malformed subtrees are
 *  pruned: a node under a broken parent produces only noise. */
export function validateRouteTree(root: Route): FileRouterError[] {
  const errors: FileRouterError[] = []
  traverse(root, {
    visit: (route) => { errors.push(...checkRouteNode(route)) },
    expand: (route) => route.segment.type === 'malformed' ? [] : route.children,
  })
  return errors
}

function checkRouteNode(route: Route): FileRouterError[] {
  const { segment } = route

  // Malformed: report the parse error; the subtree below is pruned by the walk.
  if (segment.type === 'malformed')
    return [new MalformedSegmentError(route.urlPath, segment.reason ?? 'malformed segment')]

  // A slug name may not repeat up a single route path.
  if (segment.param)
    for (let ancestor = route.parent; ancestor; ancestor = ancestor.parent)
      if (ancestor.segment.param === segment.param)
        return [new RepeatedSlugError(route.urlPath, segment.param)]

  return []
}


// - URL-tree checks -----------------------------------------------------------------------------------------------------
//
// Project the route tree to a URL tree (see `UrlNode`). Cousins that share a URL
// collapse into one node, so every cross-branch rule is a local check on a single
// node — there is no longer a same-parent vs cross-group distinction to track.


export function validateUrlTree(root: Route): FileRouterError[] {
  const errors: FileRouterError[] = []
  traverse(UrlNode.project(root), {
    visit: (node) => { errors.push(...checkUrlNode(node)) },
    expand: (node) => [...node.children.values()],
  })
  return errors
}

function checkUrlNode(node: UrlNode): FileRouterError[] {
  const errors: FileRouterError[] = []
  const screens = node.screens

  // Identity conflict: several route dirs collapsed into this one dynamic
  // position. Subsumes same-parent sibling conflicts and cross-group ones alike.
  const identityConflict = checkIdentity(node, errors)

  // Two screens at the same URL — but a reported identity conflict is the root
  // cause of the collapse, so the duplicate is just its symptom; skip it then.
  if (!identityConflict)
    for (let i = 0; i < screens.length; i++)
      for (let j = i + 1; j < screens.length; j++)
        errors.push(new DuplicateScreenError(node.url, [screens[i].modules.page!, screens[j].modules.page!]))

  // A catch-all and an optional catch-all overlap at the same position.
  if (node.catchall && node.optional)
    errors.push(new ConflictingCatchallError(node.url))

  // An optional catch-all overlaps a static sibling (both match the base path).
  if (node.optional && node.staticChildren.length)
    errors.push(new SplatIndexConflictError(node.url))

  // An optional catch-all overlaps its parent's screen (it matches zero segments).
  if (node.optional && screens.length)
    errors.push(new OptionalCatchallPageConflictError(node.optional.url))

  // A catch-all / optional catch-all must be terminal: nothing routable below it.
  for (const splat of [node.catchall, node.optional])
    if (splat?.hasScreenDescendant())
      errors.push(new CatchallNotTerminalError(splat.url))

  return errors
}

/**
 * Report a conflict when multiple route dirs collapse into one dynamic position,
 * and signal whether one was raised so the caller can drop the duplicate-screen
 * symptom. Dynamics tolerate a repeated *consistent* name across groups; catch-
 * alls and optional catch-alls allow only one route per position.
 */
function checkIdentity(node: UrlNode, errors: FileRouterError[]): boolean {
  if (node.isDynamic) {
    const names = [...new Set(node.routes.map(route => route.segment.param!))]
    if (names.length > 1) {
      errors.push(new ConflictingDynamicSegmentsError(node.url, names))
      return true
    }
  } else if (node.isCatchall) {
    if (node.routes.length > 1) {
      errors.push(new DuplicateCatchallError(node.url))
      return true
    }
  } else if (node.isOptional) {
    if (node.routes.length > 1) {
      errors.push(new DuplicateOptionalCatchallError(node.url))
      return true
    }
  }
  return false
}
