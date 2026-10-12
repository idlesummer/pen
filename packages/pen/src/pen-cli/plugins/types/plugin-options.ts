import type { PenConfig } from '@/pen-cli/config'

/** Shared construction options for pen's own Vite plugins. */
export type PluginOptions = {
  /** App route directory relative to the project root. */
  routesDir: string
  /** Dev server start timestamp, used to report startup duration. */
  startTime: number
  /** Settings from the project's pen.config.ts, replaced wholesale once
   *  pen:config's hook loads it - starts out as pen's own defaults. */
  config: PenConfig
}
