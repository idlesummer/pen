import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { BUILD_ENTRY } from '@/react/build'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    const entryPath = join(process.cwd(), BUILD_ENTRY)
    if (!existsSync(entryPath))
      throw new Error(`No build found at '${BUILD_ENTRY}' - run \`pen build\` first.`)
    await import(pathToFileURL(entryPath).href)
  },
})
