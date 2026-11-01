import { relative, sep } from 'path'

/** Checks whether a child path is equal to or contained within a parent path.
 *
 *  @param childPath - The path to check.
 *  @param parentPath - The parent path.
 *  @returns Whether the child path is equal to or contained within the parent path.
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const relativePath = relative(parentPath, childPath)
  return relativePath !== '..' && !relativePath.startsWith(`..${sep}`)
}
