import { readdirSync } from 'node:fs'
import { sep } from 'node:path'

/** Recursively collects every file under `dir` whose path ends with
 *  `extension`, already relative to `dir`. readdirSync's recursive mode
 *  joins nested paths with the platform separator - on Windows that's `\`,
 *  but every path downstream (route parsing, generated import specifiers)
 *  is built assuming `/`, so this normalizes before anything else sees it. */
export function findFiles(dir: string, ext: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter(path => path.endsWith(ext))
    .map(path => path.replaceAll(sep, '/'))
    .sort()
}
