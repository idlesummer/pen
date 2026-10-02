import { sep } from 'node:path'
import { defineCommand } from 'citty'
import { createBuilder } from 'vite'
import { findProjectRoot } from '@/lib/find-project-root'
import { pen } from '@/pen-react/plugin'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    const BUILD_APP_DIR = 'src/app'
    const BUILD_OUT_DIR = '.pen/dist'

    // Build with Pen's default Vite config, targeting the SSR environment only.
    // The plugin handles both explicit Pen builds and user `vite build` calls.
    const builder = await createBuilder({
      root: findProjectRoot(process.cwd() + sep), // add sep cuz findProjectRoot needs trailing slash
      configFile: false,
      plugins: [pen(BUILD_APP_DIR)],
      build: { outDir: BUILD_OUT_DIR },
    })

    // Diagnostics are already reported through Vite's own logger by the
    // time a failure reaches here - nothing left to print.
    await builder.build(builder.environments.ssr!)
  },
})
