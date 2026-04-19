import type { CLICommand } from '../../types'
import pc from 'picocolors'
import { pipe, duration, fileList } from '@idlesummer/tasker'
import { loadConfig } from '@/pen/config'
import { CLI_NAME, VERSION } from '@/pen/constants'

import { collectFiles } from './tasks/collect-files'
import { createMapping } from './tasks/create-mapping'
import { validatePaths } from './tasks/validate-paths'
import { createBuckets } from './tasks/create-buckets'
import { buildRouteTree } from './tasks/build-route-tree'
import { writeRouteTree } from './tasks/write-route-tree'
import { writePathComponentMap } from './tasks/write-path-component-map'
import { writeEntry } from './tasks/write-entry'
import { compileApplication } from './tasks/compile-application'

export const build: CLICommand = {
  name: 'build',
  desc: 'Build the routing structure and compile application',
  action: async () => {
    try {
      const { appDir, outDir } = await loadConfig()
      console.log(pc.cyan('  Starting production build...\n'))
      console.log(pc.bold(`  ✎  ${CLI_NAME} v${VERSION}\n`))
      console.log(pc.dim(`  entry:  ${appDir}`))
      console.log(pc.dim( '  target: node24'))
      console.log(pc.dim(`  output: ${outDir}`))
      console.log()

      const pipeline = pipe([
        collectFiles,        // step 1: flat file list
        createMapping,       // step 2: route key → abs path
        validatePaths,       // step 3: flat URL validation
        createBuckets,       // step 4: group by normalized URL (appPathsPerRoute)
        buildRouteTree,      // step 5: build RouteNode tree from buckets
        writeRouteTree,      // step 6: emit route-tree.ts
        writePathComponentMap, // step 7: emit path-component-map.ts (from mapping)
        writeEntry,          // step 8: emit entry.ts
        compileApplication,  // step 9: rolldown bundle
      ])

      const { duration: dur } = await pipeline.run({ appDir, outDir })
      console.log()
      console.log(fileList(outDir, '**/*'))
      console.log()
      console.log(pc.green(`Built in ${pc.bold(duration(dur))}`))
      console.log()
    }

    catch (err) {
      console.error(pc.red('Build failed'))
      console.log()

      const message = err instanceof Error ? err.message : String(err)
      console.error(pc.red(message))
      console.log()
      process.exit(1)
    }
  },
}
