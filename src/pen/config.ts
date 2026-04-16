import { resolve } from 'path'
import { pathToFileURL } from 'url'

/** User-facing configuration (what users write in pen.config.ts). */
export type PenConfig = Partial<ResolvedPenConfig>

/**
 * Resolved configuration with all fields guaranteed to be present.
 * This is what loadConfig() returns after merging user config with defaults.
 */
export type ResolvedPenConfig = {
  /** Directory containing your app routes. @default './src/app' */
  appDir: string
  /** Output directory for generated files and build artifacts. @default './.pen' */
  outDir: string
  /** Emit metadata files to aid debugging and tooling. @default true */
  emitMetadata: boolean
}

const defaultConfig: ResolvedPenConfig = {
  appDir: './src/app',
  outDir: './.pen',
  emitMetadata: false,
}

export function defineConfig(config: PenConfig): PenConfig {
  return config
}

/**
 * Loads pen.config.ts from the current directory.
 * Falls back to defaults if config file doesn't exist.
 * Returns a fully resolved config with all fields guaranteed to be present.
 */
export async function loadConfig(): Promise<ResolvedPenConfig> {
  try {
    const configPath = resolve(process.cwd(), 'pen.config.ts')
    const configUrl = pathToFileURL(configPath).href

    const module = await import(configUrl) as { default?: PenConfig }
    const userConfig = module.default ?? {}

    // Merge with defaults
    return { ...defaultConfig, ...userConfig }
  }
  catch {
    return defaultConfig  // Use default if config file failed to load
  }
}
