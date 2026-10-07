import { sep } from 'node:path'
import { createBuilder } from 'vite'
import pc from 'picocolors'
import { CLI_NAME, VERSION } from '@/lib/constants'
import { findProjectRoot } from '@/lib/find-project-root'
import { createPenLogger } from '@/pen-cli/logger/adapter'
import * as log from '@/pen-cli/logger/console'
import { reportRouteDiagnostics } from '@/pen-react/setup'
import { penBuild } from '../../plugins/build-plugin'
import { penTypecheck } from '../../plugins/build-typecheck'

/**
 * Creates a Vite builder configured with the `pen` plugin, ready to build
 * the app's SSR environment.
 *
 * Route diagnostics run first, outside Vite entirely, since
 * reportRouteDiagnostics is shared with `pen dev` and isn't a Vite
 * concern. Type checking runs second, as the builder's own sequential
 * buildStart plugin - see build-typecheck.ts for why that's safe.
 *
 * @param appDir - App route directory relative to the project root.
 * @param outDir - Build output directory relative to the project root.
 */
export async function createPenBuilder(appDir: string, outDir: string) {
  log.print('')
  log.banner(`${CLI_NAME} v${VERSION}`)
  log.print('')

  const root = findProjectRoot(process.cwd() + sep)
  const { warnings, error, routes } = await reportRouteDiagnostics(root, appDir)
  for (const route of routes)
    log.print(`${pc.dim('•')} ${route}`)
  for (const message of warnings)
    log.warn(message)
  if (error) {
    log.error(error)
    process.exit(1)
  }

  return createBuilder({
    root,
    configFile: false,
    customLogger: createPenLogger(true),
    plugins: [
      penTypecheck(),
      penBuild(appDir),
    ],
    build: { outDir },
  })
}
