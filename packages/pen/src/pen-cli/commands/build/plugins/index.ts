import type { Plugin } from 'vite'
import type { PenConfig } from '@/pen-cli/config'
import { penBuild } from './build-plugin'
import { penDiagnose } from './diagnose-plugin'
import { penReactCompiler } from './react-compiler-plugin'
import { penTypecheck } from './typecheck-plugin'

/** Shared construction options for pen:build's own plugins. */
export type BuildPluginOptions = {
  appDir: string
  config: PenConfig
}

/** All plugins `pen build` needs, in the order Vite should run them.
 *  Diagnostics run first since they're cheapest, typecheck second to
 *  fail fast before the more expensive bundling step. */
export function penBuildPlugins(options: BuildPluginOptions): Plugin[] {
  return [
    penDiagnose(options),
    penTypecheck(),
    penReactCompiler(options),
    penBuild(options),
  ]
}
