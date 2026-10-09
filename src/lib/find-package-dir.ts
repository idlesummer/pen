import { findPackageJSON } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

// Windows extended-length path prefix returned by `findPackageJSON`
const WINDOWS_EXTENDED_PREFIX = '\\\\?\\'

/** Finds the nearest package.json from `startDir`.
 *
 *  @param cwd - Directory to start searching from. Must end with a trailing separator.
 *  @returns The package directory, or `startDir` if none is found. */
export function findPackageDir(cwd: string): string {
  const packageJsonPath = findPackageJSON('.', pathToFileURL(cwd))
  const packageDir = packageJsonPath ? dirname(packageJsonPath) : cwd

  // findPackageJSON can return Windows extended-length paths.
  return packageDir.replace(WINDOWS_EXTENDED_PREFIX, '')
}
