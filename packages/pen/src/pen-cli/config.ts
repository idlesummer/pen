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
}

/** Defaults applied when the project's config omits them, and the initial
 *  value of `PluginOptions.config` before `pen:config`'s hook replaces it. */
export const DEFAULT_PEN_CONFIG: PenConfig = {
  reactCompiler: false,
  ink: {
    maxFps: 75,
  },
}

/** Type-checks config objects and provides editor autocomplete. */
export function defineConfig(config: PenConfig): PenConfig {
  return config
}
