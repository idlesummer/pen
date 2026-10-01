import { findPackageJSON } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Walks up from `startDir` looking for the nearest package.json, treating
 *  its directory as the project root - the same convention git/npm/tsc use
 *  to let a CLI be invoked from any subdirectory of a project. Falls back
 *  to startDir itself if none is found, rather than failing outright. Built
 *  on Node's own findPackageJSON (node:module) instead of a hand-rolled
 *  walk, since Node's own resolution logic is what's actually finding it.
 *
 *  startDir must end with a trailing separator. Without one, URL resolution
 *  treats its last segment as a filename rather than a directory, so '.'
 *  resolves one level too high - new URL('.', 'file:///a/b') is file:///a/,
 *  not file:///a/b/. process.cwd() never has a trailing separator, so
 *  callers need path.sep appended before passing it in. */
export function findProjectRoot(startDir: string): string {
  const packageJsonPath = findPackageJSON('.', pathToFileURL(startDir))
  return packageJsonPath ? dirname(packageJsonPath) : startDir
}
