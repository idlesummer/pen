import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { ENTRY_MODULE_ID } from '@/pen-cli/constants'
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
    await runner.import(ENTRY_MODULE_ID)
    await server.close()
  },
})
