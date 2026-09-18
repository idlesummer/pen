export type { CompileDiagnostic } from '@/router/compile-diagnostic'
export type { RouteNode, Endpoint, Frame, PositionConflicts, PositionNode } from './compiler'
export type { Matcher, MatchNode, ParamTable, Router } from './matcher'

export { GLOBAL_DEFAULT } from './compiler/route-module'
export { reportDiagnostics } from '@/router/compile-diagnostic'
export { compile } from './compiler'
export { createRouter } from './matcher'
