import type { PenConfig } from '@/pen-cli/config'

/** Shared construction options for pen:dev's own plugins. */
export type DevPluginOptions = {
  appDir: string
  startTime: number
  config: PenConfig
}
