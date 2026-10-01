import { existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineCommand } from 'citty'
import { findProjectRoot } from '@/lib/find-project-root'
import { BUILD_ENTRY } from '@/pen-react/plugin'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    const BUILD_OUT_DIR = '.pen/dist'

    // Runs whatever `pen build` last wrote. Imported in-process (not
    // spawned) so Ink's TUI gets the real stdin/stdout rather than
    // something piped through a child process. root is found the same way
    // the build command finds it, so `pen start` locates the same outDir
    // regardless of which subdirectory either command was run from.
    const entryPath = join(findProjectRoot(process.cwd() + sep), BUILD_OUT_DIR, BUILD_ENTRY)
    if (!existsSync(entryPath))
      throw new Error(`No build found at '${BUILD_OUT_DIR}' - run \`pen build\` first.`)

    await import(pathToFileURL(entryPath).href)
  },
})
