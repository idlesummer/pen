import { Command } from 'commander'
import { VERSION } from '@/core/constants'
import type { CLICommand, OptionSpec } from './command'

import { build } from './commands/build'
import { start } from './commands/start'

const commands = [build, start] as const

function addOptions(cmd: Command, options?: readonly OptionSpec[]) {
  for (const opt of options ?? []) {
    cmd.option(opt.flags, opt.description, opt.defaultValue)
  }
}

function registerCommand<TOptions>(program: Command, def: CLICommand<TOptions>) {
  const cmd = program.command(def.name).description(def.description)

  addOptions(cmd, def.options)

  cmd.action(async (rawOpts: unknown, command: Command) => {
    // Single, controlled boundary cast
    await def.action(rawOpts as TOptions, command)
  })
}

export async function run(argv = process.argv): Promise<number> {
  const program = new Command()

  program
    .name('pen')
    .description('Idle Summer Pen - File-based routing for React Ink')
    .version(VERSION)
    .showHelpAfterError()
    .showSuggestionAfterError()

  for (const def of commands) {
    registerCommand(program, def)
  }

  try {
    await program.parseAsync(argv)
    return 0
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : 'Unknown error')
    return 1
  }
}
