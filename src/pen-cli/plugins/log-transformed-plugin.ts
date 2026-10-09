import type { Plugin } from 'vite'
import { normalizePath } from 'vite'
import pc from 'picocolors'
import * as log from '@/pen-cli/logger/console'

/**
 * Prints each of the app's own route files as Rolldown transforms it.
 *
 * Rolldown's own "N modules transformed" summary is a fixed count baked
 * into its native binary - there's no flag that expands it into a file
 * list, so this prints one alongside it instead. Virtual modules and
 * anything outside the project (pen's own runtime, bundled deps) are
 * skipped to keep the list to what the user can actually open and edit.
 *
 * Module ids are always forward-slash, even on Windows, but `projectDir`
 * comes from `node:path` and uses the native separator there - normalize
 * it first so the prefix check and slice both actually match.
 *
 * Runs only in the SSR environment.
 *
 * @param projectDir - Absolute path to the project root.
 */
export function penLogTransformed(projectDir: string): Plugin {
  const root = normalizePath(projectDir)

  return {
    name: 'pen:log-transformed',

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    transform(code, id) {
      if (id.includes('\0') || !id.startsWith(root)) return
      log.print(pc.dim(id.slice(root.length).replace(/^\/+/, '')))
    },
  }
}
