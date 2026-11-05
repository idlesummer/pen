import { defineCommand, runMain } from 'citty'
import { DESCRIPTION, PEN_VERSION } from '@/constants'

const main = defineCommand({
  meta: {
    name: 'pen',
    version: PEN_VERSION,
    description: DESCRIPTION,
  },
  // Lazily load subcommands so unused command modules aren't imported
  subCommands: {
    build: async () =>
      (await import('./build')).buildCommand,

    create: async () =>
      (await import('./create')).createCommand,

    dev: async () => {
      // Dynamically import because react-refresh reads NODE_ENV at import time
      process.env.NODE_ENV = 'development'
      process.env.DEV = 'true'
      return (await import('./dev')).devCommand
    },
    start: async () =>
      (await import('./start')).startCommand,
  },
})

/** Runs the Pen CLI. */
export function run() {
  runMain(main)
}
