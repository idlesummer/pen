import { Command } from 'commander'
import { VERSION } from '@/core/constants'

import { build } from './commands/build'
import { start } from './commands/start'

export async function run(argv = process.argv) {
  const commands = [build, start] as const
  const program = new Command()
    .name('pen')
    .description('@idlesummer/pen - File-based routing for React Ink')
    .version(VERSION)

  for (const def of commands) {
    const cmd = program
      .command(def.name)
      .description(def.description)

    for (const opt of def.options ?? [])
      cmd.option(opt.flags, opt.description, opt.defaultValue)

    cmd.action(async (options, command) => {
      await def.action(options, command)
    })
  }

  try {
    await program.parseAsync(argv)
    return 0
  }
  catch (err) {
    console.error(err instanceof Error ? err.message : 'Unknown error')
    return 1
  }
}
