import { resolve, join } from 'path'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { watch as rolldownWatch } from 'rolldown'
import { watch as chokidarWatch } from 'chokidar'
import nodeExternals from 'rollup-plugin-node-externals'
import pc from 'picocolors'
import { pipe } from '@idlesummer/tasker'

import { buildRouteTree } from '../../build/tasks/build-route-tree'
import { writeRouteTree } from '../../build/tasks/write-route-tree'
import { writePathComponentMap } from '../../build/tasks/write-path-component-map'
import { writeEntry } from '../../build/tasks/write-entry'

interface WatchContext {
  appDir: string
  outDir: string
}

export async function watchApplication({ appDir, outDir }: WatchContext): Promise<void> {
  const entryTs = resolve(join(outDir, 'generated', 'entry.ts'))
  const entryJs = resolve(join(outDir, 'dist', 'entry.js'))

  let appProcess: ChildProcess | null = null
  let codegenRunning = false

  function restartApp() {
    if (appProcess) {
      appProcess.kill()
      appProcess = null
    }
    appProcess = spawn('node', [entryJs], { stdio: 'inherit' })
  }

  async function runCodegen() {
    if (codegenRunning) return
    codegenRunning = true
    try {
      const pipeline = pipe([buildRouteTree, writeRouteTree, writePathComponentMap, writeEntry])
      await pipeline.run({ appDir, outDir })
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(pc.red('\nCodegen failed:'), message)
    }
    finally {
      codegenRunning = false
    }
  }

  // Rolldown watch handles all changes within the module graph
  const bundleWatcher = rolldownWatch({
    input: entryTs,
    platform: 'node',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    plugins: [nodeExternals()],
    output: {
      dir: resolve(join(outDir, 'dist')),
      format: 'esm',
      sourcemap: true,
    },
  })

  bundleWatcher.on('event', (event) => {
    if (event.code === 'BUNDLE_END') {
      event.result.close()
      restartApp()
    }
    if (event.code === 'ERROR') {
      console.error(pc.red('\nBuild error:'), event.error.message)
    }
  })

  // Chokidar handles new/deleted route files (not yet in Rolldown's module graph)
  const fsWatcher = chokidarWatch(appDir, { ignoreInitial: true })

  fsWatcher.on('add', async (filePath) => {
    console.log(pc.dim(`\n  + ${filePath}`))
    await runCodegen()
  })

  fsWatcher.on('unlink', async (filePath) => {
    console.log(pc.dim(`\n  - ${filePath}`))
    await runCodegen()
  })

  console.log(pc.green('  Watching for changes...'))
  console.log()

  return new Promise<void>(() => {
    process.on('SIGINT', () => {
      bundleWatcher.close()
      fsWatcher.close()
      if (appProcess) appProcess.kill()
      process.exit(0)
    })
  })
}
