import { existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineCommand } from 'citty'
import { findProjectRoot } from '@/lib/find-project-root'
import { BUILD_ENTRY, BUILD_OUT_DIR } from '../constants'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    // Run the built entry in-process so Ink gets the real stdin/stdout.
    // Resolve from the project root so `pen start` works from subdirectories.
    const entryPath = join(findProjectRoot(process.cwd() + sep), BUILD_OUT_DIR, BUILD_ENTRY)
    if (!existsSync(entryPath))
      throw new Error(`No build found at '${BUILD_OUT_DIR}' - run \`pen build\` first.`)

    await import(pathToFileURL(entryPath).href)
  },
})
