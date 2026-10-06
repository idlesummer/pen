import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { createPenDevServer } from './create-dev-server'
import { CLI_NAME, VERSION } from '@/lib/constants'
import { APP_DIR, ENTRY_MODULE_ID } from '@/pen-cli/constants'
import * as log from '@/pen-cli/logger/console'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    log.print('')
    log.banner(`${CLI_NAME} ${VERSION}`)
    log.print('')

    // Headless Vite server for loading the app entry module
    const server = await createPenDevServer(APP_DIR)
    const runner = createServerModuleRunner(server.environments.ssr!)
    await runner.import(ENTRY_MODULE_ID)
    await server.close()
  },
})
