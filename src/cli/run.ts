import { Command } from 'commander'
import { VERSION } from '@/core/constants'

import { build } from './commands/build'
import { start } from './commands/start'

export async function run(argv = process.argv) {
  const program = new Command()
    .name('pen')
    .description('Pen - File-based routing for React Ink')
    .version(VERSION)

  for (const def of [build, start] as const) {
    const cmd = program
      .command(def.name)
      .description(def.description)

    for (const opt of def.options ?? [])
      cmd.option(opt.flags, opt.description, opt.defaultValue)

    cmd.action(async (rawOpts, command) => {
      await def.action(rawOpts, command)
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
