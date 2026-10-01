import { existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { findProjectRoot } from '@/lib/find-project-root'
import { BUILD_ENTRY } from '@/pen-react/plugin'

/** Runs whatever `pen build` last wrote. Imported in-process (not spawned)
 *  so Ink's TUI gets the real stdin/stdout rather than something piped
 *  through a child process. root is found the same way buildApp finds it,
 *  so `pen start` locates the same outDir regardless of which subdirectory
 *  either command was run from. */
export async function startApp(outDir: string): Promise<void> {
  const entryPath = join(findProjectRoot(process.cwd() + sep), outDir, BUILD_ENTRY)
  if (!existsSync(entryPath))
    throw new Error(`No build found at '${outDir}' - run \`pen build\` first.`)

  await import(pathToFileURL(entryPath).href)
}
