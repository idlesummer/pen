import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

/** Recursively collects every file under `dir` whose name ends with
 *  `extension`, as paths relative to `dir`. */
export function discoverFiles(dir: string, extension: string): string[] {
  const filePaths = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(extension))
    .map(entry => relative(dir, join(entry.parentPath, entry.name)))

  return filePaths.sort()
}
