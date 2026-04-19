import { resolve, join } from 'path'
import { pathToFileURL } from 'url'
import { watch as rolldownWatch } from 'rolldown'
import { watch as chokidarWatch } from 'chokidar'
import nodeExternals from 'rollup-plugin-node-externals'
import pc from 'picocolors'

import { transform } from '@/pen/compiler'
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

  let unmount: (() => void) | null = null
  let codegenRunning = false

  async function startApp() {
    if (unmount) {
      unmount()
      unmount = null
    }
    try {
      const entryUrl = pathToFileURL(entryJs).href + `?v=${Date.now()}`
      const { mount } = await import(entryUrl)
      const instance = mount('/')
      unmount = instance.unmount
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      process.stderr.write(pc.red('\nFailed to start app: ') + message + '\n')
    }
  }

  async function runCodegen() {
    if (codegenRunning) return
    codegenRunning = true
    try {
      // Dev equivalent of Next.js's transform() — all pipeline steps inline
      const { mapping, routeTree } = transform(appDir, outDir)
      await Promise.all([
        writeRouteTree.run({ appDir, outDir, routeTree }),
        writePathComponentMap.run({ appDir, outDir, mapping }),
        writeEntry.run({ appDir, outDir }),
      ])
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      process.stderr.write(pc.red('\nCodegen failed: ') + message + '\n')
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

  bundleWatcher.on('event', async (event) => {
    if (event.code === 'BUNDLE_END') {
      event.result.close()
      await startApp()
    }
    if (event.code === 'ERROR') {
      process.stderr.write(pc.red('\nBuild error: ') + event.error.message + '\n')
    }
  })

  // Chokidar handles new/deleted route files (not yet in Rolldown's module graph)
  const fsWatcher = chokidarWatch(appDir, { ignoreInitial: true })

  fsWatcher.on('add', async () => {
    await runCodegen()
  })

  fsWatcher.on('unlink', async () => {
    await runCodegen()
  })

  return new Promise<void>(() => {
    process.once('exit', () => {
      bundleWatcher.close()
      fsWatcher.close()
      if (unmount) unmount()
    })

    process.once('SIGINT', () => process.exit(0))
  })
}
