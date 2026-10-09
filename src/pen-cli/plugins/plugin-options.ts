/** Shared construction options for pen's own Vite plugins. */
export type PluginOptions = {
  /** App route directory relative to the project root. */
  routesDir: string
  /** Dev server start timestamp, used to report startup duration. */
  startTime?: number
}
