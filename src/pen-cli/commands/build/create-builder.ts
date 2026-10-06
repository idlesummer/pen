import { sep } from 'node:path'
import { createBuilder } from 'vite'
import { findProjectRoot } from '@/lib/find-project-root'
import { createPenLogger } from '@/pen-cli/logger/adapter'
import { penBuild } from '../../plugins/build-plugin'

/** Creates a Vite builder configured with the `pen` plugin, ready to build
 *  the app's SSR environment.
 *
 *  @param appDir - App route directory relative to the project root.
 *  @param outDir - Build output directory relative to the project root. */
export function createPenBuilder(appDir: string, outDir: string) {
  return createBuilder({
    root: findProjectRoot(process.cwd() + sep),
    configFile: false,
    customLogger: createPenLogger(),
    plugins: [penBuild(appDir)],
    build: { outDir },
  })
}
