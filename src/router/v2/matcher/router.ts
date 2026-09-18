import type { CompileDiagnostic } from '@/router/compiling/compile-diagnostic'
import type { Matcher } from './matcher'
import { compile } from '../compiler'
import { createMatcher } from './matcher'

export type Router = {
  matcher: Matcher
  modulePaths: string[] // for the generated component map
  diagnostics: CompileDiagnostic[]
}

/** Creates a router from route file paths: a matcher, diagnostics, and every
 *  module path the compiled tree can render. */
export function createRouter(filePaths: string[]): Router {
  const { positionTree, modulePaths, diagnostics } = compile(filePaths)
  const matcher = createMatcher(positionTree)
  return { matcher, modulePaths, diagnostics }
}
