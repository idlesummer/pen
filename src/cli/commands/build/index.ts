import type { CLICommand } from '../../types'
import pc from 'picocolors'
import { pipe, duration, fileList } from '@idlesummer/tasker'
import { loadConfig } from '@/pen/config'
import { CLI_NAME, VERSION } from '@/pen/constants'

// Import individual tasks
import { buildFileTree } from './tasks/build-file-tree'
import { buildSegmentTree } from './tasks/build-segment-tree'
import { buildRouteChainMap } from './tasks/build-route-chain-map'
import { buildComponentIdMap } from './tasks/build-component-id-map'
import { writeRouteMapFile } from './tasks/write-route-chain-map-file'
import { buildSerializedRoutes } from './tasks/build-serialized-routes'
import { writeSerializedTreeFile } from './tasks/write-serialized-routes-file'
import { writeComponentIdMapFile } from './tasks/write-component-id-map-file'
import { writeCompiledRoutesFile } from './tasks/write-compiled-routes-file'
import { writeEntryFile } from './tasks/write-entry-file'
import { compileApplication } from './tasks/compile-application'

export const build: CLICommand = {
  name: 'build',
  desc: 'Build the routing structure and compile application',
  action: async () => {
    try {
      const { appDir, outDir, emitMetadata } = await loadConfig()
      console.log(pc.cyan('  Starting production build...\n'))
      console.log(pc.bold(`  ✎  ${CLI_NAME} v${VERSION}\n`))
      console.log(pc.dim( `  entry:  ${appDir}`))
      console.log(pc.dim( '  target: node24'))
      console.log(pc.dim( `  output: ${outDir}`))
      console.log()

      const pipeline = pipe([
        buildFileTree,
        buildSegmentTree,
        buildRouteChainMap,
        buildComponentIdMap,
        buildSerializedRoutes,

        // Conditionally add metadata file generation tasks
        emitMetadata && writeRouteMapFile,
        emitMetadata && writeSerializedTreeFile,
        emitMetadata && writeComponentIdMapFile,

        writeCompiledRoutesFile,
        writeEntryFile,
        compileApplication,
      ])

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
