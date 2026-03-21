import type { CLICommand } from '../../types'
import pc from 'picocolors'
import { pipe } from '@idlesummer/tasker'
import { loadConfig } from '@/pen/config'
import { CLI_NAME, VERSION } from '@/pen/constants'

import { buildRouteTree } from '../build/tasks/build-route-tree'
import { writeRouteTree } from '../build/tasks/write-route-tree'
import { writePathComponentMap } from '../build/tasks/write-path-component-map'
import { writeEntry } from '../build/tasks/write-entry'
import { watchApplication } from './tasks/watch-application'

export const dev: CLICommand = {
  name: 'dev',
  desc: 'Start the application in development mode with file watching',
  action: async () => {
    try {
      const { appDir, outDir } = await loadConfig()
      console.log(pc.cyan('  Starting dev mode...\n'))
      console.log(pc.bold(`  ✎  ${CLI_NAME} v${VERSION}\n`))
      console.log(pc.dim(`  entry:  ${appDir}`))
      console.log(pc.dim(`  output: ${outDir}`))
      console.log()

      const pipeline = pipe([
        buildRouteTree,
        writeRouteTree,
        writePathComponentMap,
        writeEntry,
      ])

      await pipeline.run({ appDir, outDir })
      await watchApplication({ appDir, outDir })
    }

    catch (err) {
      console.error(pc.red('Dev mode failed'))
      console.log()

      const message = err instanceof Error ? err.message : String(err)
      console.error(pc.red(message))
      console.log()
      process.exit(1)
    }
  },
}
