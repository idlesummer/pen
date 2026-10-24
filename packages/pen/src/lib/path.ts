import { relative, sep } from 'node:path'

/** Checks whether a path is equal to or contained within a base path.
 *  @param path - The path to check.
 *  @param base - The base path.
 *  @returns Whether the path is relative to the base path. */
export function isPathRelativeTo(path: string, base: string): boolean {
  const relativePath = relative(base, path)
  return relativePath !== '..' && !relativePath.startsWith(`..${sep}`)
}
