import pc from 'picocolors'
import { pipe } from '@/core/build-tools'
import { VERSION } from '@/core/constants'
import { scanTasks } from './tasks/scan'

import type { CLICommand } from '../../types'

export const build: CLICommand = {
  name: 'build',
  desc: 'Build the route manifest and compile application',
  action: async () => {
    try {
      const appDir = './src/app'
      const outDir = './.pen'

      console.log(pc.cyan('  Starting production build...\n'))
      console.log(pc.bold(`  ✎  pen v${VERSION}\n`))
      console.log(pc.dim( `  entry:  ${appDir}`))
      console.log(pc.dim( '  target: node24'))
      console.log(pc.dim( `  output: ${outDir}`))
      console.log()

      const pipeline = pipe([
        ...scanTasks,
      ])

      const res = await pipeline.run({ appDir, outDir })
      console.log(res)

    }
    catch (err) {
      console.error(`${pc.red('✗')} Build failed`)
      console.log()

      const message = err instanceof Error ? err.message : String(err)
      console.error(pc.red(message))
      console.log()
      process.exit(1)
    }
  },
}
