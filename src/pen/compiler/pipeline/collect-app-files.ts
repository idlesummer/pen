import { readdirSync, statSync } from 'fs'
import { join, relative, resolve } from 'path'
import { DirectoryNotFoundError, NotADirectoryError } from '../errors'

/**
 * Step 1: Validates the app directory, then recursively reads it and returns
 * a flat array of relative .tsx file paths — groups, dynamic segments,
 * everything kept raw.
 *
 * Equivalent to Next.js's collectAppFiles → recursiveReadDir.
 *
 * appDir/
 * ├── screen.tsx
 * ├── about/screen.tsx
 * ├── (marketing)/blog/screen.tsx
 * └── user/[id]/screen.tsx
 *
 * → ['screen.tsx', 'about/screen.tsx', '(marketing)/blog/screen.tsx', 'user/[id]/screen.tsx']
 */
export function collectAppFiles(appDir: string): string[] {
  const absDir = resolve(appDir)
  const stat = statSync(absDir, { throwIfNoEntry: false })
  if (!stat)               throw new DirectoryNotFoundError(absDir)
  if (!stat.isDirectory()) throw new NotADirectoryError(absDir)

  const files: string[] = []
  scan(absDir, absDir, files)
  return files
}

function scan(dir: string, appDir: string, acc: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue
    const abs = join(dir, entry.name)
    if (entry.isDirectory())
      scan(abs, appDir, acc)
    else if (entry.isFile() && entry.name.endsWith('.tsx'))
      acc.push(relative(appDir, abs).replace(/\\/g, '/'))
  }
}
