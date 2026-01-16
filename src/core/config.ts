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
}

export function defineConfig(config: Partial<PenConfig>): Partial<PenConfig> {
  return config
}

export const defaultConfig: PenConfig = {
  appDir: './src/app',
  outDir: './.pen',
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

    console.log(userConfig)

    // Merge with defaults
    return { ...defaultConfig, ...userConfig }
  }
  catch {
    // Config file doesn't exist or failed to load - use defaults
    return defaultConfig
  }
}
