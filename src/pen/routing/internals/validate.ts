import { traverse } from '@/pen/lib/traverse'
import type { Segment } from './segment'
import Route from './route'
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
// Project the route tree to a URL tree (groups erased, dynamics generalized,
// malformed pruned). Cousins that share a URL collapse into one node, so every
// cross-branch rule becomes a local check on a single node — there is no longer
// a same-parent vs cross-group distinction to track.


type UrlNode = {
  key: string                     // '' | static name | '[*]' | '[...*]' | '[[...*]]'
  url: string                     // normalized URL, for messages
  routes: Route[]                 // route nodes that project to this position
  children: Map<string, UrlNode>
}

const DYNAMIC = '[*]'
const CATCHALL = '[...*]'
const OPTIONAL = '[[...*]]'

export function validateUrlTree(root: Route): FileRouterError[] {
  const errors: FileRouterError[] = []
  walk(project(root), errors)
  return errors
}

function walk(node: UrlNode, errors: FileRouterError[]): void {
  errors.push(...checkUrlNode(node))
  for (const child of node.children.values())
    walk(child, errors)
}

function checkUrlNode(node: UrlNode): FileRouterError[] {
  const errors: FileRouterError[] = []
  const catchall = node.children.get(CATCHALL)
  const optional = node.children.get(OPTIONAL)
  const statics = [...node.children.values()].filter(c => isStatic(c.key))

  // Identity conflict: several route dirs collapsed into this one dynamic
  // position. Subsumes same-parent sibling conflicts and cross-group ones alike.
  const identityConflict = checkIdentity(node, errors)

  // Two screens at the same URL — but a reported identity conflict is the root
  // cause of the collapse, so the duplicate is just its symptom; skip it then.
  if (!identityConflict) {
    const screens = node.routes.filter(r => r.modules.page)
    for (let i = 0; i < screens.length; i++)
      for (let j = i + 1; j < screens.length; j++)
        errors.push(new DuplicateScreenError(node.url, [screens[i].modules.page!, screens[j].modules.page!]))
  }

  // A catch-all and an optional catch-all overlap at the same position.
  if (catchall && optional)
    errors.push(new ConflictingCatchallError(node.url))

  // An optional catch-all overlaps a static sibling (both match the base path).
  if (optional && statics.length)
    errors.push(new SplatIndexConflictError(node.url))

  // An optional catch-all overlaps its parent's screen (it matches zero segments).
  if (optional && node.routes.some(r => r.modules.page))
    errors.push(new OptionalCatchallPageConflictError(optional.url))

  // A catch-all / optional catch-all must be terminal: nothing routable below it.
  for (const splat of [catchall, optional])
    if (splat && hasScreenDescendant(splat))
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
  switch (node.key) {
    case DYNAMIC: {
      const names = [...new Set(node.routes.map(r => r.segment.param!))]
      if (names.length > 1) {
        errors.push(new ConflictingDynamicSegmentsError(node.url, names))
        return true
      }
      return false
    }
    case CATCHALL:
      if (node.routes.length > 1) {
        errors.push(new DuplicateCatchallError(node.url))
        return true
      }
      return false
    case OPTIONAL:
      if (node.routes.length > 1) {
        errors.push(new DuplicateOptionalCatchallError(node.url))
        return true
      }
      return false
    default:
      return false
  }
}

function hasScreenDescendant(node: UrlNode): boolean {
  for (const child of node.children.values()) {
    if (child.routes.some(r => r.modules.page)) return true
    if (hasScreenDescendant(child)) return true
  }
  return false
}

function isStatic(key: string): boolean {
  return key !== DYNAMIC && key !== CATCHALL && key !== OPTIONAL
}


// - Projection ----------------------------------------------------------------------------------------------------------


function project(root: Route): UrlNode {
  const urlRoot: UrlNode = { key: '', url: '/', routes: [root], children: new Map() }
  for (const child of root.children)
    attach(child, urlRoot)
  return urlRoot
}

function attach(route: Route, into: UrlNode): void {
  if (route.segment.type === 'malformed')
    return // prune the malformed subtree

  // Groups are erased: the group's own modules belong to the parent URL, and its
  // children attach as if the group segment were not there.
  if (route.segment.type === 'group') {
    into.routes.push(route)
    for (const child of route.children)
      attach(child, into)
    return
  }

  const key = normalize(route.segment)
  const target = into.children.get(key) ?? makeChild(into, key)
  target.routes.push(route)
  for (const child of route.children)
    attach(child, target)
}

function makeChild(parent: UrlNode, key: string): UrlNode {
  const url = parent.url === '/' ? `/${key}` : `${parent.url}/${key}`
  const node: UrlNode = { key, url, routes: [], children: new Map() }
  parent.children.set(key, node)
  return node
}

function normalize(segment: Segment): string {
  switch (segment.type) {
    case 'dynamic':           return DYNAMIC
    case 'catchall':          return CATCHALL
    case 'optional-catchall': return OPTIONAL
    default:                  return segment.raw // static
  }
}
