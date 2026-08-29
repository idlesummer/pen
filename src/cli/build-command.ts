import { defineCommand } from 'citty'

export function defineBuildCommand<T>(build: () => T) {
  return defineCommand({
    meta: {
      name: 'build',
      description: 'Compile routes and generate static entry files for a pen app',
    },
    run() {
      build()
    },
  })
}
