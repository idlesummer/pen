import type { Command } from 'commander'

export type OptionSpec =
  | { flags: string; description: string }
  | { flags: string; description: string; defaultValue: string }

export type CliCommand<TOptions> = {
  name: string
  description: string
  options?: readonly OptionSpec[]
  action: (opts: TOptions, cmd: Command) => void | Promise<void>
}
