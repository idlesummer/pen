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
    // Headless Vite server for loading the app entry module
    const server = await createPenDevServer(APP_DIR)
    const runner = createServerModuleRunner(server.environments.ssr!)
    await runner.import('virtual:pen/entry-app.tsx')
    await server.close()
  },
})
