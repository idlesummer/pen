import type { RenderOptions } from 'ink'

/** Shared construction options for pen's own Vite plugins. */
export type PluginOptions = {
  /** App route directory relative to the project root. */
  routesDir: string
  /** Dev server start timestamp, used to report startup duration. */
  startTime: number
  /** Ink render() options read from the project's pen.config.ts. */
  ink?: RenderOptions
  /** Whether to run React Compiler over the app's components. */
  reactCompiler?: boolean
}
