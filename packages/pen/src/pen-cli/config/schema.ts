import type { RenderOptions as InkRenderOptions } from 'ink'

/** Settings read from the project's `pen.config.ts`. */
export type PenConfig = {
  /** Whether to run React Compiler over the app's components.
   *
   *  Experimental and off by default - see oxc-transform-react's own
   *  README before enabling it. */
  reactCompiler?: boolean
  /** Options forwarded to Ink's own `render()` call. */
  ink?: InkRenderOptions
  /** Dev server file-watching options. */
  watch?: {
    /** Poll the filesystem for changes instead of relying on native OS
     *  events. Native events on Windows can stop reporting changes after
     *  a watched directory is removed - affecting every route folder
     *  deletion - so polling defaults to on there despite its added CPU
     *  cost. Same tradeoff applies to Docker/network-mounted volumes on
     *  any OS, where this can be set explicitly. */
    usePolling?: boolean
  }
}

/** Defaults applied when the project's config omits them. */
export const DEFAULT_PEN_CONFIG: PenConfig = {
  reactCompiler: false,
  ink: {
    maxFps: 75,
  },
  watch: {
    usePolling: process.platform === 'win32',
  },
}

/** Type-checks config objects and provides editor autocomplete. */
export function defineConfig(config: PenConfig): PenConfig {
  return config
}
