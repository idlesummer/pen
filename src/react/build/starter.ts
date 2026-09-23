import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { findFiles } from '@/lib/find-files'
import { BUILD_ENTRY } from './builder'

/** Runs whatever `pen build` last wrote. Imported in-process (not spawned)
 *  so Ink's TUI gets the real stdin/stdout rather than something piped
 *  through a child process. */
export async function startApp(outDir: string, appDir: string): Promise<void> {
  const entryPath = join(process.cwd(), outDir, BUILD_ENTRY)
  if (!existsSync(entryPath))
    throw new Error(`No build found at '${outDir}' - run \`pen build\` first.`)

  warnIfStale(entryPath, appDir)
  await import(pathToFileURL(entryPath).href)
}

/** Only meaningful when source is actually sitting next to the bundle - a
 *  built bundle can also run standalone on a machine with no src/ at all,
 *  which has nothing to compare against and isn't an error case, just
 *  nothing to warn about. A warning, not a block: there are legitimate
 *  reasons to run an old build on purpose. */
function warnIfStale(entryPath: string, appDir: string): void {
  const appPath = join(process.cwd(), appDir)
  if (!existsSync(appPath)) return

  const entryMtime = statSync(entryPath).mtimeMs
  const sourceFiles = findFiles(appPath, '.tsx')
  const newestSourceMtime = sourceFiles.reduce((newest, file) => Math.max(newest, statSync(join(appPath, file)).mtimeMs), 0)

  if (newestSourceMtime > entryMtime)
    console.warn(`[warn] '${BUILD_ENTRY}' is older than '${appDir}' - run \`pen build\` to pick up recent changes`)
}
