import { defineCommand, runMain } from 'citty'
import { DESCRIPTION, PEN_VERSION } from '@/constants'
import { buildCommand } from './commands/build'
import { createCommand } from './commands/create'

const main = defineCommand({
  meta: {
    name: 'pen',
    version: PEN_VERSION,
    description: DESCRIPTION,
  },
  // Lazily load subcommands so unused command modules aren't imported
  subCommands: {
    build: buildCommand,
    create: createCommand,
    dev: async () => {
      // Dynamically import because react-refresh reads NODE_ENV at import time
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
