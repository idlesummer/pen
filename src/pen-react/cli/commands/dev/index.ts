import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { createPenDevServer } from './create-server'
import { APP_DIR } from '@/pen-react/cli/constants'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    // React/Ink read this at module-init, inside the module runner's own
    // import of the entry module below - must be set before that happens.
    process.env.NODE_ENV = 'development'

    // Headless server driven by a module runner instead of an HTTP server
    // or browser - it serves the terminal program's own entry module.
    const server = await createPenDevServer(APP_DIR)

    // Diagnostics are already reported through Vite's own logger by the
    // time a failure reaches here - nothing left to print.
    const runner = createServerModuleRunner(server.environments.ssr!)
    await runner.import('virtual:pen/entry-app.tsx')

    await server.close()
  },
})
