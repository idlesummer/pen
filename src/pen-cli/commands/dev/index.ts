import { defineCommand } from 'citty'
import { createServerModuleRunner } from 'vite'
import { createPenDevServer } from './create-dev-server'
import { APP_DIR } from '@/pen-cli/constants'
import { CLI_NAME, VERSION } from '@/lib/constants'
import * as log from '@/pen-cli/logger'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development server',
  },
  run: async () => {
    log.banner(`${CLI_NAME} ${VERSION}`)
    const start = Date.now()

    // Headless Vite server for loading the app entry module
    const server = await createPenDevServer(APP_DIR)
    const runner = createServerModuleRunner(server.environments.ssr!)
    log.ready(`Ready in ${Date.now() - start}ms`)

    await runner.import('virtual:pen/entry-app.tsx')
    await server.close()
  },
})
