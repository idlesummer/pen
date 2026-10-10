import type { Plugin } from 'vite'
import type { PluginOptions } from './plugin-options'
import { loadPenConfig } from '@/pen-cli/config'

/**
 * Loads the project's `pen.config.ts` and writes its settings onto the
 * shared `options` object, for penBuild/penDev/penReactRefreshInk to read later.
 *
 * Uses Vite's own `config` hook instead of a param passed in at
 * construction time - it already hands over everything loadPenConfig
 * needs (`config.root`, `env.command`), and it's guaranteed to finish
 * before any environment-level hook (resolveId/load) ever runs, so
 * `options.ink`/`options.reactCompiler` are always populated by the time
 * their consumers read them.
 *
 * @param options - Shared plugin options to write settings onto once loaded.
 */
export function penConfig(options: PluginOptions): Plugin {
  return {
    name: 'pen:config',

    async config(config, env) {
      const penConfig = await loadPenConfig(config.root!, env.command)
      options.ink = penConfig.ink
      options.reactCompiler = penConfig.reactCompiler
    },
  }
}
