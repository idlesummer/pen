import type { RenderOptions } from 'ink'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile } from 'vite'
import * as log from '@/pen-cli/logger/console'

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
export function defineConfig(config: PenConfig): PenConfig {
  return config
}

const CONFIG_FILENAMES = ['pen.config.ts', 'pen.config.js', 'pen.config.mjs']

/**
 * Loads the project's `pen.config.ts` (or `.js`/`.mjs`), if one exists.
 *
 * Reuses Vite's own config loader (esbuild-transpiled, so plain TS syntax
 * works with no project tsconfig involved) instead of hand-rolling one -
 * its return type is `UserConfig`, Vite's own shape, but the loader itself
 * doesn't actually validate against it, so it works unmodified for pen's
 * own config shape too.
 *
 * A broken config file is the user's own, expected, actionable mistake -
 * reported with a clean message instead of citty's raw stack trace.
 *
 * @param projectDir - Project root to look for the config file in.
 * @param command - Matches Vite's own `ConfigEnv.command` so the loader behaves consistently.
 */
export async function loadPenConfig(projectDir: string, command: 'build' | 'serve'): Promise<PenConfig> {
  const configFile = CONFIG_FILENAMES.find(name => existsSync(join(projectDir, name)))
  if (!configFile) return {}

  try {
    const mode = command === 'build' ? 'production' : 'development'
    const result = await loadConfigFromFile({ command, mode }, configFile, projectDir)
    return (result?.config ?? {}) as PenConfig
  }
  catch (err) {
    log.error(`Failed to load ${configFile}: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}
