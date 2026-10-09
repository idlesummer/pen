import type { PenConfig } from '@/pen-react/config'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfigFromFile } from 'vite'
import * as log from '@/pen-cli/logger/console'

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
