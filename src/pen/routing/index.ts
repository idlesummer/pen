// Public surface of the file router. Everything outside this module imports
// from here — `internals/` is private and reached only through these re-exports.

// Build
export { buildRouteTree, readRouteTree } from './builder'

// Validate (non-throwing — collect findings without aborting the build)
export { validate } from './internals/validate'

// Trees
export { Route, type RouteModule, type RouteModules } from './internals/route'
export { Segment, type SegmentType } from './internals/segment'
export { UrlNode } from './internals/url-node'

// Findings
export * from './errors'
