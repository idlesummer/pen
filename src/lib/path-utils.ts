import { parse, join } from 'path'

export function removeExtension(filePath: string) {
  const parsed = parse(filePath)
  return join(parsed.dir, parsed.name)  // Use posix for forward slashes
}
