import { sep } from 'node:path'
import { createBuilder } from 'vite'
import { CLI_NAME, VERSION } from '@/lib/constants'
import { findProjectRoot } from '@/lib/find-project-root'
import * as log from '@/pen-cli/logger/console'
import { penBuild } from '../../plugins/build-plugin'
import { penDiagnose } from '../../plugins/diagnose-plugin'
import { penTypecheck } from '../../plugins/typecheck-plugin'

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
 * @param appDir - App route directory relative to the project root.
 * @param outDir - Build output directory relative to the project root.
 */
export async function createPenBuilder(appDir: string, outDir: string) {
  log.print('')
  log.banner(`${CLI_NAME} v${VERSION}`)
  log.print('')

  const projectDir = findProjectRoot(process.cwd() + sep)
  return createBuilder({
    root: projectDir,
    configFile: false,
    plugins: [
      penDiagnose(appDir),
      penTypecheck(),
      penBuild(appDir),
    ],
    build: { outDir },
  })
}
