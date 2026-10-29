import type { PenConfig } from '@/pen-cli/config'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile, mergeConfig } from 'vite'
import { DEFAULT_PEN_CONFIG } from '@/pen-cli/config'
import * as log from '@/pen-cli/logger/console'

/** Project config filename. */
const CONFIG_FILENAME = 'pen.config.ts'

/** Loads `pen.config.ts` if present, merged over pen's own defaults.
 *
 *  Uses Vite's esbuild-based loader for TypeScript without requiring a
 *  project tsconfig. Vite's config type is not enforced by the loader.
 *  Load errors are reported without citty's raw stack trace.
 *
 *  The default loader ('bundle') writes a temporary file under
 *  node_modules/.vite-temp to import the compiled config - 'runner' loads
 *  it through Vite's own module runner instead, entirely in memory.
 *
 *  @param projectDir - Project root.
 *  @param command - Vite-compatible command.
 *  @returns The loaded config, merged over defaults. */
export async function loadPenConfig(projectDir: string, command: 'build' | 'serve'): Promise<PenConfig> {
  if (!existsSync(join(projectDir, CONFIG_FILENAME)))
    return DEFAULT_PEN_CONFIG

  try {
    const mode = command === 'build' ? 'production' : 'development'
    const configLoader = 'runner'
    const file = await loadConfigFromFile({ command, mode }, CONFIG_FILENAME, projectDir, undefined, undefined, configLoader)
    const config = (file?.config ?? {}) as PenConfig
    return mergeConfig(DEFAULT_PEN_CONFIG, config)
  }
  catch (err) {
    log.error(`Failed to load ${CONFIG_FILENAME}: ${Error.isError(err) ? err.message : err}`)
    process.exit(1)
  }
}
