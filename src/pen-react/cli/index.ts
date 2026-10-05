import { defineCommand, runMain } from 'citty'
import { CLI_NAME, DESCRIPTION, VERSION } from '@/lib/constants'

const main = defineCommand({
  meta: {
    name: CLI_NAME,
    version: VERSION,
    description: DESCRIPTION,
  },
  // Lazily load subcommands so unused command modules aren't imported
  subCommands: {
    build: async () => {
      const { buildCommand } = await import('./commands/build')
      return buildCommand
    },
    dev: async () => {
      // react-refresh/runtime reads NODE_ENV at import time, so set it before
      // importing the dev command. Ink reads DEV when render() runs, so it only
      // needs to be set before running the app entry module.
      process.env.NODE_ENV = 'development'
      process.env.DEV = 'true'
      const { devCommand } = await import('./commands/dev')
      return devCommand
    },
    start: async () => {
      const { startCommand } = await import('./commands/start')
      return startCommand
    },
  },
})

/** Runs the Pen CLI. */
export function run() {
  runMain(main)
}
