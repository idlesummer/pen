// Public surface of the file router. Everything outside this module imports
// from here — `internals/` is private and reached only through these re-exports.

import { Route } from './internals/route'
import { validate } from './internals/validate'
import { RouteValidationErrors } from './errors'

/**
 * Build the route tree and validate it. Accumulates every finding and throws a
 * single `RouteValidationErrors`, or returns the tree when clean.
 *
 * The two halves are available on their own: `Route.read(path)` builds the tree
 * without validating, and `validate(root)` collects findings without throwing.
 */
export function buildRouteTree(appPath: string): Route {
  const root = Route.read(appPath)

  const errors = validate(root)
  if (errors.length) throw new RouteValidationErrors(errors)

  return root
}

// Validate (non-throwing — collect findings without aborting the build)
export { validate } from './internals/validate'

// Trees
export { Route, type RouteModule, type RouteModules } from './internals/route'
export { Segment, type SegmentType } from './internals/segment'
export { UrlNode } from './internals/url-node'

// Findings
export * from './errors'
