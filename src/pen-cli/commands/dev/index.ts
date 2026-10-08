import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { createPenDevServer } from './create-dev-server'
import { ENTRY_MODULE_ID } from '@/pen-cli/constants'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    // Headless Vite server for loading the app entry module
    const server = await createPenDevServer()
    const runner = createServerModuleRunner(server.environments.ssr!)
    await runner.import(ENTRY_MODULE_ID)
    await server.close()
  },
})
