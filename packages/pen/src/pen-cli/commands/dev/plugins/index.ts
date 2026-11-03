import type { Plugin } from 'vite'
import type { DevPluginOptions } from './types'
import { ENTRY_MODULE_ID, penDevEntry } from './dev-entry-plugin'
import { penRefresh } from './refresh-plugin'

export { ENTRY_MODULE_ID }
export type { DevPluginOptions }

/** All plugins `pen dev` needs, in the order Vite should run them. */
export function penDevPlugins(options: DevPluginOptions): Plugin[] {
  return [
    penDevEntry(options),
    penRefresh(options),
  ]
}
