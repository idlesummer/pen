import type { RenderOptions } from 'ink'

/**
 * The subset of Ink's own `render()` options that make sense from a static
 * config file - plain booleans/numbers only. Streams (`stdout`/`stdin`/
 * `stderr`) and callbacks (`onRender`) aren't included since they can't
 * survive being read from `pen.config.ts` and substituted into the app's
 * bundled entry module as a JSON literal.
 */
export type PenInkOptions = Pick<RenderOptions,
  | 'debug'
  | 'exitOnCtrlC'
  | 'patchConsole'
  | 'isScreenReaderEnabled'
  | 'maxFps'
  | 'incrementalRendering'
  | 'concurrent'
  | 'interactive'
  | 'alternateScreen'
>

/** Settings read from the project's `pen.config.ts`. */
export interface PenConfig {
  /** Options forwarded to Ink's own `render()` call. */
  ink?: PenInkOptions
}

/** Identity helper for authoring `pen.config.ts` - gives the config object
 *  type-checking and editor autocomplete, same as Vite/Vitest's `defineConfig`. */
export function definePenConfig(config: PenConfig): PenConfig {
  return config
}
