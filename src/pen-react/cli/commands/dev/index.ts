import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { createPenDevServer } from './vite/create-server'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    const DEV_APP_DIR = 'src/app'

    // Headless server driven by a module runner instead of an HTTP server
    // or browser - it serves the terminal program's own entry module.
    const server = await createPenDevServer(DEV_APP_DIR)

    // Diagnostics are already reported through Vite's own logger by the
    // time a failure reaches here - nothing left to print.
    const runner = createServerModuleRunner(server.environments.ssr!)
    await runner.import('virtual:pen/entry-app.tsx')

    await server.close()
  },
})
