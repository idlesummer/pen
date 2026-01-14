import type { CLICommand } from '../types'

export type StartOptions = {
  dir?: string
  output?: string
}

export const start: CLICommand<StartOptions> = {
  name: 'start',
  description: 'Start the application',
  options: [
    { flags: '-d, --dir <path>', description: 'App directory to scan' },
    { flags: '-o, --output <path>', description: 'Output directory' },
  ],
  action: async (opts) => {
    // opts is BuildOptions
    // ...
  },
}
