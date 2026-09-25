import { defineCommand, runMain } from 'citty'
import { CLI_NAME, DESCRIPTION, VERSION } from '@/lib/constants'
import { buildCommand } from './commands/build'
import { startCommand } from './commands/start'

const main = defineCommand({
  meta: {
    name: CLI_NAME,
    version: VERSION,
    description: DESCRIPTION,
  },
  subCommands: {
    build: buildCommand,
    start: startCommand,
    // dev: devCommand,
  },
})

export function run() {
  runMain(main)
}
