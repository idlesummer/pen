import { existsSync, globSync } from 'node:fs'
import { sep } from 'node:path'

/** Recursively collects every file under `dir` matching `pattern`, already
 *  relative to `dir`. globSync's nested paths use the platform separator -
 *  on Windows that's `\`, but every path downstream (route parsing, generated
 *  import specifiers) is built assuming `/`, so this normalizes before
 *  anything else sees it. Not sorted by default, so that's done here too. */
export function findFiles(dir: string, pattern: string): string[] {
  if (!existsSync(dir))
    throw new Error(`No such directory: '${dir}'`)

  return globSync(pattern, { cwd: dir })
    .map(path => path.replaceAll(sep, '/'))
    .sort()
}
