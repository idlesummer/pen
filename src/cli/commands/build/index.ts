import pc from 'picocolors'
import { loadConfig } from '@/core/config'
import { pipe, duration, fileList } from '@idlesummer/tasker'
import { CLI_NAME, VERSION } from '@/core/constants'
import { scanTasks } from './tasks/scan'
import { generateTasks } from './tasks/generate'
import { compileTask } from './tasks/compile'

import type { CLICommand } from '../../types'

export const build: CLICommand = {
  name: 'build',
  desc: 'Build the route manifest and compile application',
  action: async () => {
    try {
      const { appDir, outDir } = await loadConfig()
      console.log(pc.cyan('  Starting production build...\n'))
      console.log(pc.bold(`  ✎  ${CLI_NAME} v${VERSION}\n`))
      console.log(pc.dim( `  entry:  ${appDir}`))
      console.log(pc.dim( '  target: node24'))
      console.log(pc.dim( `  output: ${outDir}`))
      console.log()

      const tasks = [...scanTasks, ...generateTasks, compileTask]
      const pipeline = pipe(tasks)

      const { duration: dur } = await pipeline.run({ appDir, outDir })
      console.log()
      console.log(fileList(outDir, '**/*'))
      console.log()
      console.log(`${pc.green('✓')} Built in ${pc.bold(duration(dur))}`)
      console.log()
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
