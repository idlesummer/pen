import type { ViteBuilder } from 'vite'
import type { PluginOptions } from '@/pen-cli/plugins/plugin-options'
import { createBuilder } from 'vite'
import { APP_DIR_NAME, CLI_NAME, VERSION } from '@/lib/constants'
import { findPackageDir } from '@/lib/find-package-dir'
import * as log from '@/pen-cli/logger/console'
import { penBuild } from '@/pen-cli/plugins/build-plugin'
import { penConfig } from '@/pen-cli/plugins/config-plugin'
import { penDiagnose } from '@/pen-cli/plugins/diagnose-plugin'
import { penTypecheck } from '@/pen-cli/plugins/typecheck-plugin'

/**
 * Creates a Vite builder configured with the `pen` plugin, ready to build
 * the app's SSR environment.
 *
 * Route diagnostics and type checking both run as the builder's own
 * sequential buildStart plugins, diagnostics first since they're cheaper -
 * see diagnose-plugin.ts and typecheck-plugin.ts for why that's safe and
 * ordered.
 *
 * No customLogger here - build has no Ink terminal to protect, so
 * Vite's own stock logger handles its own messages. Pen never has to
 * track or react to anything Vite might say.
 *
 * @param srcDir - Directory containing the app directory, relative to the project root.
 * @param outDir - Build output directory relative to the project root.
 */
export function createPenBuilder(srcDir: string, outDir: string): Promise<ViteBuilder> {
  log.banner(`${CLI_NAME} v${VERSION}`)

  const projectDir = findPackageDir(process.cwd())
  if (!projectDir) {
    log.error('Could not find a package.json from the current directory.')
    process.exit(1)
  }
  const routesDir = `${srcDir}/${APP_DIR_NAME}`
  const options: PluginOptions = { routesDir }

  return createBuilder({
    root: projectDir,
    configFile: false,
    plugins: [
      penConfig(options),
      penDiagnose(options),
      penTypecheck(),
      penBuild(options),
    ],
    build: { outDir },
  })
}
