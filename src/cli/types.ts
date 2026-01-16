import type { Command } from 'commander'

export type CLICommand<TOptions> = {
  name: string
  desc: string
  action: (opts: TOptions, cmd: Command) => void | Promise<void>
}
