import { defineCommand } from 'citty'
import { BUILD_OUT_DIR } from '../../constants'
import { createPenBuilder } from './build-plugin'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    const BUILD_APP_DIR = 'src/app'

    // Build with Pen's default Vite config, targeting the SSR environment only.
    // The plugin handles both explicit Pen builds and user `vite build` calls.
    const builder = await createPenBuilder(BUILD_APP_DIR, BUILD_OUT_DIR)

    // Diagnostics are already reported through Vite's own logger by the
    // time a failure reaches here - nothing left to print.
    await builder.build(builder.environments.ssr!)
  },
})
