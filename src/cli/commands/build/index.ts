import type { CLICommand } from '../../types'
import pc from 'picocolors'
import { pipe, duration, fileList } from '@idlesummer/tasker'
import { loadConfig } from '@/pen/config'
import { CLI_NAME, VERSION } from '@/pen/constants'

// Import individual tasks
import { buildFileTree } from './tasks/build-file-tree'
import { buildSegmentTree } from './tasks/build-segment-tree'
import { buildRouteManifest } from './tasks/build-route-manifest'
import { buildComponentMap } from './tasks/build-component-map'
import { buildElementTree } from './tasks/build-element-tree'
import { writeManifestFile } from './tasks/write-manifest-file'
import { writeElementTreeFile } from './tasks/write-element-tree-file'
import { writeComponentMapFile } from './tasks/write-component-map-file'
import { writeRoutesFile } from './tasks/write-routes-file'
import { writeEntryFile } from './tasks/write-entry-file'
import { compileApplication } from './tasks/compile-application'

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

      const pipeline = pipe([
        buildFileTree,
        buildSegmentTree,
        buildRouteManifest,
        buildComponentMap,
        buildElementTree,
        writeManifestFile,
        writeElementTreeFile,
        writeComponentMapFile,
        writeRoutesFile,
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
