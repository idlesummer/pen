import { sep } from 'node:path'
import { createBuilder } from 'vite'
import pc from 'picocolors'
import { CLI_NAME, VERSION } from '@/lib/constants'
import { findProjectRoot } from '@/lib/find-project-root'
import { createPenLogger } from '@/pen-cli/logger/adapter'
import * as log from '@/pen-cli/logger/console'
import { reportRouteDiagnostics } from '@/pen-react/setup'
import { penBuild } from '../../plugins/build-plugin'
import { typeCheck } from '../../plugins/build-typecheck'

/**
 * Creates a Vite builder configured with the `pen` plugin, ready to build
 * the app's SSR environment.
 *
 * Runs pen's own pre-flight checks - route diagnostics, then type
 * checking - before the builder is even created. A failure here never
 * touches Vite's build pipeline, so it never produces one of rolldown's
 * wrapped stack traces - just the message and a clean exit.
 *
 * @param appDir - App route directory relative to the project root.
 * @param outDir - Build output directory relative to the project root.
 */
export async function createPenBuilder(appDir: string, outDir: string) {
  const root = findProjectRoot(process.cwd() + sep)

  log.print('')
  log.banner(`${CLI_NAME} v${VERSION}`)
  log.print('')

  const { warnings, error, routes } = await reportRouteDiagnostics(root, appDir)
  for (const route of routes)
    log.print(`${pc.dim('•')} ${route}`)
  for (const message of warnings)
    log.warn(message)
  if (error) {
    log.error(error)
    process.exit(1)
  }

  const typeErrors = await typeCheck(root)
  if (typeErrors) {
    log.error(typeErrors)
    process.exit(1)
  }

  return createBuilder({
    root,
    configFile: false,
    customLogger: createPenLogger(true),
    plugins: [penBuild(appDir)],
    build: { outDir },
  })
}
