import { defineCommand } from 'citty'
import { APP_DIR, OUT_DIR } from '../../constants'
import * as log from '../../logger/console'
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

    // Printed last, right before Vite's own build banner takes over -
    // diagnostics and typecheck failures above would have exited already.
    log.wait('Building app')

    await builder.build(builder.environments.ssr!)
  },
})
