import type { RenderOptions as InkRenderOptions } from 'ink'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile } from 'vite'
import * as log from '@/pen-cli/logger/console'

/** Settings read from the project's `pen.config.ts`. */
export type PenConfig = {
  /** Options forwarded to Ink's own `render()` call. */
  ink?: InkRenderOptions
}

/** Project config filename. */
const CONFIG_FILENAME = 'pen.config.ts'

/** Type-checks config objects and provides editor autocomplete. */
export function defineConfig(config: PenConfig): PenConfig {
  return config
}

/** Loads `pen.config.ts` if present.
 *
 *  Uses Vite's esbuild-based loader for TypeScript without requiring a
 *  project tsconfig. Vite's config type is not enforced by the loader.
 *  Load errors are reported without citty's raw stack trace.
 *
 *  @param projectDir - Project root.
 *  @param command - Vite-compatible command.
 *  @returns The loaded config, or an empty object if no config exists. */
export async function loadPenConfig(projectDir: string, command: 'build' | 'serve'): Promise<PenConfig> {
  if (!existsSync(join(projectDir, CONFIG_FILENAME)))
    return {}

  try {
    const mode = command === 'build' ? 'production' : 'development'
    const file = await loadConfigFromFile({ command, mode }, CONFIG_FILENAME, projectDir)
    return (file?.config ?? {}) as PenConfig
  }
  catch (err) {
    log.error(`Failed to load ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : err}`)
    process.exit(1)
  }
}
