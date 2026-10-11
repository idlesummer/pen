import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { INK_VERSION, REACT_VERSION, VERSION } from '@/lib/constants'
import gitignoreTemplate from './templates/gitignore.txt' with { type: 'text' }
import configTemplate from './templates/pen.config.ts.txt' with { type: 'text' }
import pageTemplate from './templates/page.tsx.txt' with { type: 'text' }
import tsconfigTemplate from './templates/tsconfig.json.txt' with { type: 'text' }

function createPackageJson(name: string) {
  return JSON.stringify({
    name,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'pen dev',
      build: 'pen build',
      start: 'pen start',
    },
    dependencies: {
      '@idlesummer/pen': `^${VERSION}`,
      ink: INK_VERSION,
      react: REACT_VERSION,
    },
    devDependencies: {
      typescript: '^6.0.3',
    },
  }, null, 2)
}

/** Writes a fresh pen project's files into `targetDir`. */
export async function scaffoldProject(targetDir: string, name: string) {
  await mkdir(join(targetDir, 'src/app'), { recursive: true })

  await writeFile(join(targetDir, 'package.json'), createPackageJson(name))
  await writeFile(join(targetDir, 'tsconfig.json'), tsconfigTemplate)
  await writeFile(join(targetDir, '.gitignore'), gitignoreTemplate)
  await writeFile(join(targetDir, 'pen.config.ts'), configTemplate)
  await writeFile(join(targetDir, 'src/app/page.tsx'), pageTemplate)
}
