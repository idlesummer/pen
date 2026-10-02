import { findPackageJSON } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

// Windows extended-length path prefix returned by `findPackageJSON`
const WINDOWS_EXTENDED_PREFIX = '\\\\?\\'

/** Finds the nearest package.json from `startDir`.
 *
 *  @param startDir - Directory to start searching from. Must end with a trailing separator.
 *  @returns The package directory, or `startDir` if none is found. */
export function findProjectRoot(startDir: string): string {
  const packageJsonPath = findPackageJSON('.', pathToFileURL(startDir))
  const root = packageJsonPath ? dirname(packageJsonPath) : startDir

  // findPackageJSON can return Windows extended-length paths.
  return root.replace(WINDOWS_EXTENDED_PREFIX, '')
}
