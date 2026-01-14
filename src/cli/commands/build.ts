import type { CLICommand } from '../types'

export type BuildOptions = {
  dir?: string
  output?: string
}

export const build: CLICommand<BuildOptions> = {
  name: 'build',
  description: 'Build the route manifest and compile application',
  options: [
    { flags: '-d, --dir <path>', description: 'App directory to scan' },
    { flags: '-o, --output <path>', description: 'Output directory' },
  ],
  action: async (opts) => {
    // opts is BuildOptions
    // ...
  },
}
