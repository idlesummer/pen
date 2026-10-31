/** Dynamically imports each path, relative to appDir, and returns the
 *  loaded modules keyed by their path.
 *
 *  @param appDir - Directory the paths are resolved within.
 *  @param paths - File paths to import, relative to appDir. */
export async function loadModules(appDir: string, paths: string[]): Promise<Record<string, unknown>> {
  const entries = paths.map(async path => [path, await import(/* @vite-ignore */ `/${appDir}/${path}`)] as const)
  return Object.fromEntries(await Promise.all(entries))
}
