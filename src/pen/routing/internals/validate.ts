/**
 * Route validation — two passes over the built tree, split by reachability
 * (what a check needs in order to fire). See `docs/routing-validation.md`.
 *
 *   1. Route tree — pointer-local rules whose inputs never leave the route tree
 *      (a malformed name, a slug repeated up one path). Owned by `Route`.
 *   2. URL projection — everything that only surfaces once groups are flattened
 *      and cousins that share a URL collapse into one node. Owned by `UrlNode`.
 *
 * Each node knows its own rules (`localErrors`); this module only drives the
 * walks and gathers the findings. The walk over the route tree prunes malformed
 * subtrees — a node under a broken parent produces only noise.
 */

import { traverse } from '@/pen/lib/traverse'
import { UrlNode } from './url-node'
import type { Route } from './route'
import type { FileRouterError } from '../errors'

export function validate(root: Route): FileRouterError[] {
  const errors: FileRouterError[] = []

  traverse(root, {
    visit: (route) => errors.push(...route.localErrors()),
    expand: (route) => route.segment.isMalformed ? [] : route.children,
  })

  traverse(UrlNode.project(root), {
    visit: (node) => errors.push(...node.localErrors()),
    expand: (node) => [...node.children.values()],
  })

  return errors
}
