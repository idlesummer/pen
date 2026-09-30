import { posix, win32 } from 'node:path'

/**
 * Normalizes a path by replacing backslashes with forward slashes.
 *
 * @param path - The path to normalize.
 * @returns The path with forward slash separators.
 */
export function normalize(path: string): string {
  return path.replaceAll(win32.sep, posix.sep)
}
