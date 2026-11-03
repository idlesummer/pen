import type { Plugin } from 'vite'
import type { DevPluginOptions } from './types'
import { penDevEntry, ENTRY_MODULE_ID } from './dev-entry-plugin'
import { penRefresh } from './refresh-plugin'

export type { DevPluginOptions }
export { ENTRY_MODULE_ID }

/** All plugins `pen dev` needs, in the order Vite should run them. */
export function penDevPlugins(options: DevPluginOptions): Plugin[] {
  return [
    penDevEntry(options),
    penRefresh(options),
  ]
}
