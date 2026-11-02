import type { Plugin } from 'vite'
import type { PenConfig } from '@/pen-cli/config'
import { penDevEntry } from './dev-entry-plugin'
import { penRefresh } from './refresh-plugin'

/** Shared construction options for pen:dev's own plugins. */
export type DevPluginOptions = {
  appDir: string
  startTime: number
  config: PenConfig
}

/** All plugins `pen dev` needs, in the order Vite should run them. */
export function penDevPlugins(options: DevPluginOptions): Plugin[] {
  return [
    penDevEntry(options),
    penRefresh(options),
  ]
}
