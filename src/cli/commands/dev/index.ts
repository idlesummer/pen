import type { CLICommand } from '../../types'
import pc from 'picocolors'
import { loadConfig } from '@/pen/config'
import { CLI_NAME, VERSION } from '@/pen/constants'

import { watchApplication } from './tasks/watch-application'
import { transform } from '@/pen/compiler'

import { writeRouteTree } from '../build/tasks/write-route-tree'
import { writePathComponentMap } from '../build/tasks/write-path-component-map'
import { writeEntry } from '../build/tasks/write-entry'

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

      // Initial codegen — same pipeline as build, minus compileApplication
      const { mapping, routeTree } = transform(appDir, outDir)
      await Promise.all([
        writeRouteTree.run({ appDir, outDir, routeTree }),
        writePathComponentMap.run({ appDir, outDir, mapping }),
        writeEntry.run({ appDir, outDir }),
      ])

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
