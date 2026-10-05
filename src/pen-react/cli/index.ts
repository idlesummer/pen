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
      // react-refresh/runtime reads NODE_ENV at import time, so set it here before
      // importing the dev command to ensure it loads its development version
      process.env.NODE_ENV = 'development'
      // Ink only registers its reconciler with the React DevTools global hook -
      // the mechanism Fast Refresh uses to find the mounted tree - when DEV is
      // the literal string 'true' (see ink's Instance constructor). Read at
      // render() call time, not import time, so unlike NODE_ENV above this
      // doesn't need to precede the dynamic import - it just needs to be set
      // before the entry module's render() call, which is always later.
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
