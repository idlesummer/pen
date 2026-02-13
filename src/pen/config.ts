import { resolve } from 'path'
import { pathToFileURL } from 'url'

/**
 * Resolved configuration with all fields guaranteed to be present.
 * This is what loadConfig() returns after merging user config with defaults.
 */
export interface ResolvedPenConfig {
  /**
   * Directory containing your app routes.
   * @default './src/app'
   */
  appDir: string

  /**
   * Output directory for generated files and build artifacts.
   * @default './.pen'
   */
  outDir: string

  /**
   * Emit metadata files (manifest, components, element-tree) to aid debugging and tooling.
   * These files provide introspection into your app's structure.
   * @default true
   */
  emitMetadata: boolean
}

/**
 * User-facing configuration (what users write in pen.config.ts).
 * All fields are optional and will be merged with defaults.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PenConfig extends Partial<ResolvedPenConfig> {}

export function defineConfig(config: PenConfig): PenConfig {
  return config
}

const defaultConfig: ResolvedPenConfig = {
  appDir: './src/app',
  outDir: './.pen',
  emitMetadata: false,
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
    const userConfig = module.default || {}

    // Merge with defaults
    return { ...defaultConfig, ...userConfig }
  }
  catch {
    // Config file doesn't exist or failed to load - use defaults
    return defaultConfig
  }
}
