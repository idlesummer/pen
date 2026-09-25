import { defineCommand } from 'citty'
import { startApp } from '@/pen-react/build'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    const BUILD_OUT_DIR = '.pen/dist'
    await startApp(BUILD_OUT_DIR)
  },
})
