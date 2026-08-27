import { readdirSync } from 'node:fs'

/** Recursively collects every file under `dir` whose path ends with
 *  `extension`, already relative to `dir`. */
export function discoverFiles(dir: string, extension: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter(path => path.endsWith(extension))
    .sort()
}
