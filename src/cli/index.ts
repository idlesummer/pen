import { defineCommand, runMain } from 'citty'
import { CLI_NAME, DESCRIPTION, VERSION } from '@/lib/constants'
import { buildCommand } from './commands/build'

const main = defineCommand({
  meta: {
    name: CLI_NAME,
    version: VERSION,
    description: DESCRIPTION,
  },
  subCommands: {
    build: buildCommand,
    // dev: devCommand,
    // start: startCommand
  },
})

export function run() {
  runMain(main)
}
