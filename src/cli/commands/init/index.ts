// src/cli/commands/init/index.ts
import { existsSync } from 'fs'
// import { mkdir, writeFile } from 'fs/promises'
import pc from 'picocolors'

import { CLI_NAME } from '@/core/constants'
import type { CLICommand } from '../../types'

export const init: CLICommand = {
  name: 'init',
  desc: 'Initialize a new Pen project',
  action: async () => {
    console.log(pc.cyan(`\n  Initializing ${CLI_NAME} project...\n`))

    // Check if already initialized
    if (existsSync('pen.config.ts')) {
      console.error(pc.yellow('⚠') + ' Project already initialized')
      console.error(pc.dim('  pen.config.ts already exists'))
      return
    }

    // TODO: Create pen.config.ts
    // TODO: Create src/app structure
    // TODO: Show success message

    console.log(pc.green('✓') + ' Project initialized!')
  },
}
