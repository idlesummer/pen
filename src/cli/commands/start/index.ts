import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import pc from 'picocolors'

import { loadConfig } from '@/pen/config'
import { CLI_NAME } from '@/pen/constants'
import type { CLICommand } from '../../types'

export const start: CLICommand = {
  name: 'start',
  desc: 'Start the application',
  action: async () => {
    const { outDir } = await loadConfig()
    const initialUrl = '/'
    const entryPath = resolve(outDir, 'dist', 'entry.js')

    // Check if build exists
    if (!existsSync(entryPath)) {
      console.error(pc.red('✗') + ' Build not found')
      console.error(pc.dim(`  Run "${CLI_NAME} build" first`))
      throw new Error('Build not found')  // Let Commander handle exit
    }

    // Import and run the bundled entry
    const entryUrl = pathToFileURL(entryPath).href
    const { run } = await import(entryUrl)

    // Run with initial URL
    await run(initialUrl)
  },
}
