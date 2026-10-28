import type { Diagnostic, Endpoint } from '../compiler'
import type { Match } from './matcher'
import { compileApp } from '../compiler'
import { match } from './matcher'

export type RouteMatcher =
  (url: string) => Match

export type Router = {
  routeMatcher: RouteMatcher
  modulePaths: string[] // for the generated component map
  pageEndpoints: Endpoint<unknown>[] // for validation that needs each page's own frame chain
  diagnostics: Diagnostic[]
}

/** Creates a router from route file paths: a matcher, diagnostics, and every
 *  module path the compiled tree can render. */
export function createRouter(filePaths: string[]): Router {
  const { positionTree, modulePaths, pageEndpoints, diagnostics } = compileApp(filePaths)
  const routeMatcher: RouteMatcher = (url) => match(positionTree, url)
  return { routeMatcher, modulePaths, pageEndpoints, diagnostics }
}
