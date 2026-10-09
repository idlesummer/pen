import { findPackageJSON } from 'node:module'
import { dirname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// Windows extended-length path prefix returned by `findPackageJSON`
const WINDOWS_EXTENDED_PREFIX = '\\\\?\\'

/** Finds the nearest package directory from `cwd`, which must be an existing directory.
 *
 *  @param cwd - Directory to search from.
 *  @returns The package directory, or `undefined` if:
 *    - none is found, or the search reaches a `node_modules` directory first
 *    - `cwd` doesn't exist or isn't a directory
 *    - the nearest `package.json` is malformed (it is not skipped) */
export function findPackageDir(cwd: string): string | undefined {
  try {
    const base = pathToFileURL(cwd + sep) // allowed since extra trailing separators are collapsed
    const packageJsonPath = findPackageJSON('.', base)
    const packageDir = packageJsonPath && dirname(packageJsonPath)
    return packageDir?.replace(WINDOWS_EXTENDED_PREFIX, '') // since the func can return Windows extended-length paths
  }
  catch {
    // return undefined
  }
}
