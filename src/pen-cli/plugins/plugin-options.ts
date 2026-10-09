/**
 * Shared construction options for pen's own Vite plugins - the builder
 * and dev server each build one of these and pass the same object to
 * every plugin that needs it, instead of each plugin taking its own
 * bespoke positional arguments.
 */
export interface PluginOptions {
  /** App route directory relative to the project root. */
  routesDir: string
  /** When the dev server started, as from `Date.now()` - only set on the
   *  dev server's options, where penDev reports how long it took to get ready. */
  startTime?: number
}
