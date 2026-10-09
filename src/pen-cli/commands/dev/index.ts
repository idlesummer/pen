import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'
import { createPenDevServer } from './create-dev-server'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    // Headless Vite server for loading the app entry module
    const server = await createPenDevServer('src')
    const runner = createServerModuleRunner(server.environments.ssr!)
    try {
      await runner.import(ENTRY_MODULE_ID)
    }
    catch (err) {
      // Route diagnostics fail with a clean, already-formatted message -
      // anything else is unexpected and keeps its full stack trace.
      if (!(err instanceof Error) || !('plugin' in err)) throw err
      log.error(err.message)
      process.exit(1)
    }
    await server.close()
  },
})
