import type { PenConfig } from '@/pen-cli/config'

/** Shared construction options for pen:build's own plugins. */
export type BuildPluginOptions = {
  appDir: string
  config: PenConfig
}
