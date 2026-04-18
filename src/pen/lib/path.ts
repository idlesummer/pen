import { parse, join } from 'path'

/**
 * Returns a file path without its extension.
 *
 * @example
 * rootname('/foo/bar/baz.txt') // '/foo/bar/baz'
 */
export function rootname(filePath: string) {
  const { dir, name } = parse(filePath)
  return join(dir, name)
}
