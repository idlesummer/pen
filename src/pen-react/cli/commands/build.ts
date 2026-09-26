import { defineCommand } from 'citty'
import { buildApp } from '@/pen-react/cli/build'

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile routes and bundle the app with Vite',
  },
  run: async () => {
    const BUILD_APP_DIR = 'src/app'
    const BUILD_OUT_DIR = '.pen/dist'
    // Diagnostics are already reported through Vite's own logger by the
    // time a failure reaches here - nothing left to print.
    await buildApp(BUILD_APP_DIR, BUILD_OUT_DIR)
  },
})
