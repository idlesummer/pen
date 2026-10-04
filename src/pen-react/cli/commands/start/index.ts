import { existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineCommand } from 'citty'
import { findProjectRoot } from '@/lib/find-project-root'
import { ENTRY_FILE, OUT_DIR } from '@/pen-react/cli/constants'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    // Run the built entry in-process so Ink gets the real stdin/stdout.
    // Resolve from the project root so `pen start` works from subdirectories.
    const entryPath = join(findProjectRoot(process.cwd() + sep), OUT_DIR, ENTRY_FILE)
    if (!existsSync(entryPath))
      throw new Error(`No build found at '${OUT_DIR}' - run \`pen build\` first.`)

    await import(pathToFileURL(entryPath).href)
  },
})
