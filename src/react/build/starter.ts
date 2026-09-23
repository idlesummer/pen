import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { APP_DIR } from '@/lib/constants'
import { findFiles } from '@/lib/find-files'
import { BUILD_ENTRY } from './builder'

/** Runs whatever `pen build` last wrote. Imported in-process (not spawned)
 *  so Ink's TUI gets the real stdin/stdout rather than something piped
 *  through a child process. */
export async function startApp(): Promise<void> {
  const entryPath = join(process.cwd(), BUILD_ENTRY)
  if (!existsSync(entryPath))
    throw new Error(`No build found at '${BUILD_ENTRY}' - run \`pen build\` first.`)

  warnIfStale(entryPath)
  await import(pathToFileURL(entryPath).href)
}

/** Only meaningful when source is actually sitting next to the bundle - a
 *  built bundle can also run standalone on a machine with no src/ at all,
 *  which has nothing to compare against and isn't an error case, just
 *  nothing to warn about. A warning, not a block: there are legitimate
 *  reasons to run an old build on purpose. */
function warnIfStale(entryPath: string): void {
  const appDir = join(process.cwd(), APP_DIR)
  if (!existsSync(appDir)) return

  const entryMtime = statSync(entryPath).mtimeMs
  const sourceFiles = findFiles(appDir, '.tsx')
  const newestSourceMtime = sourceFiles.reduce((newest, file) => Math.max(newest, statSync(join(appDir, file)).mtimeMs), 0)

  if (newestSourceMtime > entryMtime)
    console.warn(`[warn] '${BUILD_ENTRY}' is older than '${APP_DIR}' - run \`pen build\` to pick up recent changes`)
}
