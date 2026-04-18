import { parse, join } from 'path'

export function rootname(filePath: string) {
  const { dir, name } = parse(filePath)
  return join(dir, name)
}
