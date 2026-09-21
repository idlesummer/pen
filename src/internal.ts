// Framework-internal exports - for pen's own generated/bundled code
// (entry-app.tsx, the legacy codegen pipeline) to use, not for app authors.
// Reachable only via this subpath because entry-app.tsx gets bundled by a
// consumer's own Vite, with no access to pen's internal @/ path alias -
// this is the one place that constraint forces a public entry point at all.

export { App } from './react'
export type { ComponentMap, RouteComponent, RouteModule } from './react'
export { DefaultFallback, ErrorFallback, toModuleByPath } from './react'

export { GLOBAL_DEFAULT, GLOBAL_ERROR, getRouteModuleType, formatDiagnostics, compileApp, createRouter } from './router'
