import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { BUILD_ENTRY_FILE, BUILD_OUT_DIR } from '@/react/build'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    const entryPath = join(process.cwd(), BUILD_OUT_DIR, BUILD_ENTRY_FILE)
    if (!existsSync(entryPath))
      throw new Error(`No build found at '${join(BUILD_OUT_DIR, BUILD_ENTRY_FILE)}' - run \`pen build\` first.`)
    await import(pathToFileURL(entryPath).href)
  },
})
