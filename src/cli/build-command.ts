import { defineCommand } from 'citty'

/** Creates a `build` CLI command that invokes the given build function. */
export function defineBuildCommand<T>(build: () => T) {
  return defineCommand({
    meta: {
      name: 'build',
      description: 'Compile routes and generate static entry files for a pen app',
    },
    run: () =>
      build(),
  })
}
