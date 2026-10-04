import { sep } from 'node:path'
import { createBuilder } from 'vite'
import { findProjectRoot } from '@/lib/find-project-root'
import { pen } from './build-plugin'

/** Creates a Vite builder configured with the `pen` plugin, ready to build
 *  the app's SSR environment.
 *
 *  @param appDir - App route directory relative to the project root.
 *  @param outDir - Build output directory relative to the project root. */
export function createPenBuilder(appDir: string, outDir: string) {
  const root = findProjectRoot(process.cwd() + sep)
  return createBuilder({
    root,
    configFile: false,
    plugins: [pen(appDir)],
    build: { outDir },
  })
}
