import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Walks up from `startDir` looking for the nearest package.json, treating
 *  its directory as the project root - the same convention git/npm/tsc use
 *  to let a CLI be invoked from any subdirectory of a project. Falls back
 *  to startDir itself if none is found, rather than failing outright. */
export function findProjectRoot(startDir: string): string {
  let dir = startDir
  while (true) {
    if (existsSync(join(dir, 'package.json')))
      return dir

    const parent = dirname(dir)
    if (parent === dir)
      return startDir

    dir = parent
  }
}
