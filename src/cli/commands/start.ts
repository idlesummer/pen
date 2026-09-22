import { defineCommand } from 'citty'
import { startApp } from '@/react/build'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Run the app built by `pen build`',
  },
  run: async () => {
    await startApp()
  },
})
