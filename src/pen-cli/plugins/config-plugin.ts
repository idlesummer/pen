import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { loadPenConfig } from '@/pen-cli/config'

/** Loads the project's `pen.config.ts` and replaces `options.config` with
 *  it, for penBuild/penDev/penRefresh/penReactCompiler to read later.
 *
 *  Uses Vite's own `config` hook instead of a param passed in at
 *  construction time - it already hands over everything loadPenConfig
 *  needs (`config.root`, `env.command`), and it's guaranteed to finish
 *  before any environment-level hook (resolveId/load) ever runs, so
 *  `options.config` always holds the real settings by the time their
 *  consumers read it.
 *
 * @param options - Shared plugin options to replace `config` on once loaded. */
export function penConfig(options: PluginOptions): Plugin {
  return {
    name: 'pen:config',

    async config(config, env) {
      options.config = await loadPenConfig(config.root!, env.command)
    },
  }
}
