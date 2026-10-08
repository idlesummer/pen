import { sep } from 'node:path'
import { createBuilder } from 'vite'
import { CLI_NAME, VERSION } from '@/lib/constants'
import { findProjectRoot } from '@/lib/find-project-root'
import * as log from '@/pen-cli/logger/console'
import { reportRouteDiagnostics } from '@/pen-react/setup'
import { penBuild } from '../../plugins/build-plugin'
import { penTypecheck } from '../../plugins/typecheck-plugin'

/**
 * Creates a Vite builder configured with the `pen` plugin, ready to build
 * the app's SSR environment.
 *
 * Route diagnostics run first, outside Vite entirely, since
 * reportRouteDiagnostics is shared with `pen dev` and isn't a Vite
 * concern. Type checking runs second, as the builder's own sequential
 * buildStart plugin - see typecheck-plugin.ts for why that's safe.
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

  const root = findProjectRoot(process.cwd() + sep)
  const { warnings, error } = await reportRouteDiagnostics(root, appDir)
  for (const message of warnings)
    log.warn(message)
  if (error) {
    log.error(error)
    process.exit(1)
  }

  return createBuilder({
    root,
    configFile: false,
    plugins: [
      penTypecheck(),
      penBuild(appDir),
    ],
    build: { outDir },
  })
}
