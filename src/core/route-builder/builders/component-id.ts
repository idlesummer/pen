import { removeExtension } from '@/lib/path-utils'

export function buildComponentId(filePath: string): string {
  const withoutExtension = removeExtension(filePath)
  return withoutExtension.replace(/^\//, '')
}
