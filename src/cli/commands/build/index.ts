import type { CLICommand } from '../../types'
import pc from 'picocolors'
import { pipe, duration, fileList } from '@idlesummer/tasker'
import { loadConfig } from '@/pen/config'
import { CLI_NAME, VERSION } from '@/pen/constants'

// Import individual tasks
import { buildFileTree } from './tasks/build-file-tree'
import { buildSegmentTree } from './tasks/build-segment-tree'
import { buildRouteMap } from './tasks/build-route-map'
import { buildComponentIndexMap } from './tasks/build-component-index-map'
import { buildSerializedTree } from './tasks/build-serialized-component-tree'
import { writeRouteMapFile } from './tasks/write-route-map-file'
import { writeSerializedTreeFile } from './tasks/write-serialized-component-tree-file'
import { writeComponentIndexMapFile } from './tasks/write-component-index-map-file'
import { writeCompiledRoutesFile } from './tasks/write-compiled-routes-file'
import { writeEntryFile } from './tasks/write-entry-file'
import { compileApplication } from './tasks/compile-application'

export const build: CLICommand = {
  name: 'build',
  desc: 'Build the route manifest and compile application',
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
        buildRouteMap,
        buildComponentIndexMap,
        buildSerializedTree,

        // Conditionally add metadata file generation tasks
        emitMetadata && writeRouteMapFile,
        emitMetadata && writeSerializedTreeFile,
        emitMetadata && writeComponentIndexMapFile,

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
