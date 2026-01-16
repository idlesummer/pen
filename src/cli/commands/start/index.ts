import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import pc from 'picocolors'

import { CLI_NAME } from '@/core/constants'
import type { CLICommand } from '../../types'

export const start: CLICommand = {
  name: 'start',
  desc: 'Start the application',
  action: async () => {
    const initialUrl = '/'
    const outDir = './.pen'
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
