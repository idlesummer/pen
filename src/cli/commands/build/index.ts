import pc from 'picocolors'
import { pipe, duration, fileList } from '@idlesummer/tasker'
import { loadConfig } from '@/core/config'
import { CLI_NAME, VERSION } from '@/core/constants'
import type { CLICommand } from '../../types'

// Import individual tasks
import { scanFilesystem } from './tasks/scan-filesystem'
import { buildSegmentTree } from './tasks/build-segment-tree'
import { generateManifest } from './tasks/generate-manifest'
import { buildComponents } from './tasks/build-component-entries'
import { writeManifestFile } from './tasks/write-manifest-file'
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

      const tasks = [
        scanFilesystem,
        buildSegmentTree,
        generateManifest,
        buildComponents,
        writeManifestFile,
        writeRoutesFile,
        writeEntryFile,
        compileApplication,
      ]
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
