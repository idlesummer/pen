import { parse, posix } from 'path'

export function removeExtension(filePath: string): string {
  const parsed = parse(filePath)
  return posix.join(parsed.dir, parsed.name)  // Use posix for forward slashes
}
