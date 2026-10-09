import type { RenderOptions } from 'ink'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile } from 'vite'
import * as log from '@/pen-cli/logger/console'

/**
 * Ink's own `render()` options, forwarded as-is for now.
 *
 * Not every field survives being read from `pen.config.ts` and substituted
 * into the app's bundled entry module as a JSON literal - streams
 * (`stdout`/`stdin`/`stderr`) and the `onRender` callback won't work.
 * Deliberately not narrowed to the JSON-safe subset yet - revisit once it's
 * clearer which fields are actually worth exposing.
 */
export type PenInkOptions = RenderOptions

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

const CONFIG_FILENAME = 'pen.config.ts'

/**
 * Loads the project's `pen.config.ts`, if one exists.
 *
 * `.ts` only - pen is a TypeScript-first framework, so there's no `.js`/
 * `.mjs` fallback to support.
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
  if (!existsSync(join(projectDir, CONFIG_FILENAME))) return {}

  try {
    const mode = command === 'build' ? 'production' : 'development'
    const result = await loadConfigFromFile({ command, mode }, CONFIG_FILENAME, projectDir)
    return (result?.config ?? {}) as PenConfig
  }
  catch (err) {
    log.error(`Failed to load ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}
