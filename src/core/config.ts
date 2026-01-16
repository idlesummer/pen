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

/**
 * Type-safe config helper for pen.config.ts.
 * Provides autocomplete and validation.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@idlesummer/pen'
 *
 * export default defineConfig({
 *   appDir: './src/app',
 *   outDir: './.pen',
 * })
 * ```
 */
export function defineConfig(config: Partial<PenConfig>): Partial<PenConfig> {
  return config
}

/**
 * Default configuration values.
 */
export const defaultConfig: PenConfig = {
  appDir: './src/app',
  outDir: './.pen',
}
