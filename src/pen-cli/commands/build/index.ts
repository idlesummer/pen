import { defineCommand } from 'citty'
import { APP_DIR, OUT_DIR } from '@/pen-cli/constants'
import { createPenBuilder } from './create-builder'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    // Build with Pen's default Vite config, targeting the SSR environment only.
    // The plugin handles both explicit Pen builds and user `vite build` calls.
    const builder = await createPenBuilder(APP_DIR, OUT_DIR)

    // Diagnostics are already reported through Vite's own logger by the
    // time a failure reaches here - nothing left to print.
    await builder.build(builder.environments.ssr!)
  },
})
