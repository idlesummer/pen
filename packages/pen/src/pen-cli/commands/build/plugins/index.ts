import type { Plugin } from 'vite'
import type { BuildPluginOptions } from './types'
import { penBuildEntry } from './build-entry-plugin'
import { penDiagnose } from './diagnose-plugin'
import { penReactCompiler } from './react-compiler-plugin'
import { penTypecheck } from './typecheck-plugin'

export type { BuildPluginOptions }

/** All plugins `pen build` needs, in the order Vite should run them.
 *  Diagnostics run first since they're cheapest, typecheck second to
 *  fail fast before the more expensive bundling step. */
export function penBuildPlugins(options: BuildPluginOptions): Plugin[] {
  return [
    penDiagnose(options),
    penTypecheck(),
    penReactCompiler(options),
    penBuildEntry(options),
  ]
}
