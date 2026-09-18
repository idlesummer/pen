export type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
export type { RouteNode, Endpoint, Frame, PositionConflicts, PositionNode } from './compiler'
export type { Matcher, MatchNode, ParamTable } from './matcher'
export type { Router } from './router'

export { GLOBAL_DEFAULT } from './compiler/route-module'
export { reportDiagnostics } from '@/router/compiling/compile-diagnostic'
export { compile } from './compiler'
export { createRouter } from './router'
