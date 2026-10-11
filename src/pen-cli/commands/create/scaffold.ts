import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PACKAGE_NAME, VERSION, INK_VERSION, REACT_VERSION } from '@/lib/constants'
import configTemplate from './templates/pen.config.ts.txt' with { type: 'text' }
import pageTemplate from './templates/page.tsx.txt' with { type: 'text' }
import packageTemplate from './templates/package.json.txt' with { type: 'text' }
import tsconfigTemplate from './templates/tsconfig.json.txt' with { type: 'text' }
import gitignoreTemplate from './templates/.gitignore.txt' with { type: 'text' }

const PROJECT_NAME_TOKEN = '__PEN_PROJECT_NAME__'
const PACKAGE_NAME_TOKEN = '__PEN_PACKAGE_NAME__'
const PACKAGE_VERSION_TOKEN = '__PEN_VERSION__'
const INK_VERSION_TOKEN = '__INK_VERSION__'
const REACT_VERSION_TOKEN = '__REACT_VERSION__'
const REFERENCE_DIRECTIVE = /^\/\/\/.*\r?\n(?:\r?\n)?/

function createPackageJson(projectName: string) {
  return packageTemplate
    .replaceAll(PROJECT_NAME_TOKEN, () => projectName)
    .replaceAll(PACKAGE_NAME_TOKEN, () => PACKAGE_NAME)
    .replaceAll(PACKAGE_VERSION_TOKEN, () => VERSION)
    .replaceAll(INK_VERSION_TOKEN, () => INK_VERSION)
    .replaceAll(REACT_VERSION_TOKEN, () => REACT_VERSION)
}

function createPenConfig() {
  return configTemplate
    .replace(REFERENCE_DIRECTIVE, () => '')
    .replaceAll(PACKAGE_NAME_TOKEN, () => PACKAGE_NAME)
}

/** Writes a fresh pen project's files into `targetDir`. */
export async function createProjectScaffold(targetDir: string, name: string) {
  await mkdir(join(targetDir, 'src/app'), { recursive: true })
  await Promise.all([
    writeFile(join(targetDir, 'src/app/page.tsx'), pageTemplate),
    writeFile(join(targetDir, 'package.json'), createPackageJson(name)),
    writeFile(join(targetDir, 'tsconfig.json'), tsconfigTemplate),
    writeFile(join(targetDir, '.gitignore'), gitignoreTemplate),
    writeFile(join(targetDir, 'pen.config.ts'), createPenConfig()),
  ])
}
