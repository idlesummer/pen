import { buildCommand, type BuildOptions } from './build'
import { startCommand, type StartOptions } from './start'

export interface DevOptions extends BuildOptions, StartOptions {
  // pass
}

export async function devCommand(options: DevOptions = {}) {
  // Build first
  await buildCommand({
    dir: options.dir,
    output: options.output,
  })

  // Then start
  await startCommand({
    url: options.url,
    manifest: options.manifest,
  })
}
