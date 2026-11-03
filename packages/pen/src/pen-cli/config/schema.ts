import type { RenderOptions as InkRenderOptions } from 'ink'

/** Settings read from the project's `pen.config.ts`. */
export type PenConfig = {
  /** Whether to run React Compiler over the app's components.
   *
   *  Experimental and off by default - see oxc-transform-react's own
   *  README before enabling it.
   */
  reactCompiler?: boolean
  /** Options forwarded to Ink's own `render()` call. */
  ink?: InkRenderOptions
  /** Dev server file-watching options. */
  watch?: {
    /** Use polling instead of native filesystem events.
     *
     *  Recommended for Windows, where native events can stop detecting changes
     *  after directory deletion, and for Docker/network-mounted volumes.
     *  Defaults to `true` on Windows.
     */
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
