import { resolve } from 'path'
import { pathToFileURL } from 'url'

export interface PenConfig {
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
  emitMetadata?: boolean
}

export function defineConfig(config: Partial<PenConfig>): Partial<PenConfig> {
  return config
}

export const defaultConfig: PenConfig = {
  appDir: './src/app',
  outDir: './.pen',
  emitMetadata: true,
}

/**
 * Loads pen.config.ts from the current directory.
 * Falls back to defaults if config file doesn't exist.
 */
export async function loadConfig(): Promise<PenConfig> {
  try {
    const configPath = resolve(process.cwd(), 'pen.config.ts')
    const configUrl = pathToFileURL(configPath).href

    const module = await import(configUrl) as { default?: Partial<PenConfig> }
    const userConfig = module.default || {}

    // Merge with defaults
    return { ...defaultConfig, ...userConfig }
  }
  catch {
    // Config file doesn't exist or failed to load - use defaults
    return defaultConfig
  }
}
