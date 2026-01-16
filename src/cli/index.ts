// src/cli/run.ts
import { Command } from 'commander'
import { CLI_NAME, DESCRIPTION, VERSION } from '@/core/constants'
import { build } from './commands/build'
import { start } from './commands/start'

function createProgram(program: Command) {
  program
    .name(CLI_NAME)
    .description(DESCRIPTION)
    .version(VERSION)

  const commands = [build, start] as const
  for (const { name, desc, action } of commands) {
    program
      .command(name)
      .description(desc)
      .action(action)
  }
  return program
}

export async function run(argv = process.argv) {
  const program = createProgram(new Command())

  try {
    await program.parseAsync(argv)
    return 0
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(message)
    return 1
  }
}
