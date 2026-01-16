import type { CLICommand } from '../../types'

export type StartOptions = {
  dir?: string
  output?: string
}

export const start: CLICommand<StartOptions> = {
  name: 'start',
  desc: 'Start the application',
  action: async (opts) => {
    // opts is BuildOptions
    // ...
  },
}
