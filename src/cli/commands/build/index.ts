import type { CLICommand } from '../../types'

export type BuildOptions = {
  dir?: string
  output?: string
}

export const build: CLICommand<BuildOptions> = {
  name: 'build',
  desc: 'Build the route manifest and compile application',
  action: async (opts) => {
    // opts is BuildOptions
    // ...
  },
}
