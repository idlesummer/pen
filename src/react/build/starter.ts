import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { BUILD_ENTRY } from './builder'

/** Runs whatever `pen build` last wrote. Imported in-process (not spawned)
 *  so Ink's TUI gets the real stdin/stdout rather than something piped
 *  through a child process. */
export async function startApp(): Promise<void> {
  const entryPath = join(process.cwd(), BUILD_ENTRY)
  if (!existsSync(entryPath))
    throw new Error(`No build found at '${BUILD_ENTRY}' - run \`pen build\` first.`)

  await import(pathToFileURL(entryPath).href)
}
