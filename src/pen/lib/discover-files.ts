import { globSync } from 'node:fs'

/** Recursively collects every file under `dir` matching `extension`,
 *  already relative to `dir`. */
export function discoverFiles(dir: string, extension: string): string[] {
  return globSync(`**/*${extension}`, { cwd: dir }).sort()
}
