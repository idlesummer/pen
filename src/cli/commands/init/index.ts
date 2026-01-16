import type { CLICommand } from '../../types'

export type StartOptions = {
  dir?: string
  output?: string
}

export const init: CLICommand<StartOptions> = {
  name: 'init',
  desc: 'Initialize the application',
  action: async (opts) => {
    // opts is BuildOptions
    // ...
  },
}
