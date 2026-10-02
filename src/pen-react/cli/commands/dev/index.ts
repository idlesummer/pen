import { defineCommand } from 'citty'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the pen development environment',
  },
  run: async () => {
    // Hello world!
  },
})
