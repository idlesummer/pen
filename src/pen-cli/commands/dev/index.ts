import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { APP_DIR_NAME } from '@/lib/constants'
import { ENTRY_MODULE_ID } from '@/pen-cli/constants'
import { createPenDevServer } from './create-dev-server'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    // Headless Vite server for loading the app entry module
    const server = await createPenDevServer(`src/${APP_DIR_NAME}`)
    const runner = createServerModuleRunner(server.environments.ssr!)
    await runner.import(ENTRY_MODULE_ID)
    await server.close()
  },
})
