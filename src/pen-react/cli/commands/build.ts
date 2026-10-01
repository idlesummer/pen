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

    // Bundles the app with Vite, using a default config equivalent to what a
    // user's own vite.config.ts would need if they added the plugin
    // themselves. Vite creates both client and SSR environments, so
    // explicitly build only the server one - the plugin's own
    // applyToEnvironment gate protects a user's own `vite build` the same
    // way, since that call builds every environment by default.
    //
    // root is found explicitly (rather than left to Vite's default, which
    // is just process.cwd()) so `pen build` works from any subdirectory of
    // the project, the same way git/npm do - appDir and outDir both
    // resolve against it.
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
