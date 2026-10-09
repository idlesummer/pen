import type { PluginOptions } from '@/pen-cli/plugins/plugin-options'
import { sep } from 'node:path'
import { createBuilder } from 'vite'
import { APP_DIR_NAME, CLI_NAME, VERSION } from '@/lib/constants'
import { findProjectRoot } from '@/lib/find-project-root'
import { loadPenConfig } from '@/pen-cli/config'
import * as log from '@/pen-cli/logger/console'
import { penBuild } from '@/pen-cli/plugins/build-plugin'
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
export async function createPenBuilder(srcDir: string, outDir: string) {
  const projectDir = findProjectRoot(process.cwd() + sep)
  const penConfig = await loadPenConfig(projectDir, 'build')
  const options: PluginOptions = {
    routesDir: `${srcDir}/${APP_DIR_NAME}`,
    ink: penConfig.ink,
  }
  log.banner(`${CLI_NAME} v${VERSION}`)

  return createBuilder({
    root: projectDir,
    configFile: false,
    plugins: [
      penDiagnose(options),
      penTypecheck(),
      penBuild(options),
    ],
    build: { outDir },
  })
}
