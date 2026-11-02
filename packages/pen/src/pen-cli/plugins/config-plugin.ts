import type { Plugin } from 'vite'
import type { PluginOptions } from './types/plugin-options'
import { loadPenConfig } from '@/pen-cli/load-config'

/** Loads `pen.config.ts` and updates the shared plugin options. */
export function penConfig(options: PluginOptions): Plugin {
  return {
    name: 'pen:config',

    async config(config, env) {
      options.config = await loadPenConfig(config.root!, env.command)
    },
  }
}
