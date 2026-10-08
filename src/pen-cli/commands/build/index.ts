import { defineCommand } from 'citty'
import { APP_DIR_NAME } from '@/lib/constants'
import { OUT_DIR } from '../../constants'
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
    const builder = await createPenBuilder(`src/${APP_DIR_NAME}`, OUT_DIR)

    // Printed right before Vite's own build banner takes over. Route
    // diagnostics and typecheck both run after this, as the builder's own
    // sequential buildStart plugins - see create-builder.ts.
    log.wait('Building app')

    await builder.build(builder.environments.ssr!)
  },
})
