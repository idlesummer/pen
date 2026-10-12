import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PEN_VERSION, INK_VERSION, REACT_VERSION, ESLINT_VERSION, TYPES_NODE_VERSION, TYPES_REACT_VERSION, TYPESCRIPT_VERSION } from '@/constants'
import configTemplate from './templates/pen.config.ts.txt' with { type: 'text' }
import eslintConfigTemplate from './templates/eslint.config.js.txt' with { type: 'text' }
import pageTemplate from './templates/page.tsx.txt' with { type: 'text' }
import packageTemplate from './templates/package.json.txt' with { type: 'text' }
import tsconfigTemplate from './templates/tsconfig.json.txt' with { type: 'text' }
import gitignoreTemplate from './templates/.gitignore.txt' with { type: 'text' }

const PEN_PROJECT_NAME_TOKEN = '__PEN_PROJECT_NAME__'
const PEN_VERSION_TOKEN = '__PEN_VERSION__'
const INK_VERSION_TOKEN = '__INK_VERSION__'
const REACT_VERSION_TOKEN = '__REACT_VERSION__'
const ESLINT_VERSION_TOKEN = '__ESLINT_VERSION__'
const TYPES_NODE_VERSION_TOKEN = '__TYPES_NODE_VERSION__'
const TYPES_REACT_VERSION_TOKEN = '__TYPES_REACT_VERSION__'
const TYPESCRIPT_VERSION_TOKEN = '__TYPESCRIPT_VERSION__'

function createPackageJson(projectName: string) {
  return packageTemplate
    .replaceAll(PEN_PROJECT_NAME_TOKEN, () => projectName)
    .replaceAll(PEN_VERSION_TOKEN, () => PEN_VERSION)
    .replaceAll(INK_VERSION_TOKEN, () => INK_VERSION)
    .replaceAll(REACT_VERSION_TOKEN, () => REACT_VERSION)
    .replaceAll(ESLINT_VERSION_TOKEN, () => ESLINT_VERSION)
    .replaceAll(TYPES_NODE_VERSION_TOKEN, () => TYPES_NODE_VERSION)
    .replaceAll(TYPES_REACT_VERSION_TOKEN, () => TYPES_REACT_VERSION)
    .replaceAll(TYPESCRIPT_VERSION_TOKEN, () => TYPESCRIPT_VERSION)
}

/** Creates a fresh Pen project scaffold in `targetDir`.
*
*   Writes the project configuration files and initial page, using `name`
*   as the package name in `package.json`.
*
*   @param targetDir - Directory to create the project files in.
*   @param name - Project name used as the package name. */
export async function createProjectScaffold(targetDir: string, name: string) {
  await Promise.all([
    mkdir(join(targetDir, 'src/app'), { recursive: true })
      .then(() => writeFile(join(targetDir, 'src/app/page.tsx'), pageTemplate)),
    writeFile(join(targetDir, 'package.json'), createPackageJson(name)),
    writeFile(join(targetDir, 'tsconfig.json'), tsconfigTemplate),
    writeFile(join(targetDir, '.gitignore'), gitignoreTemplate),
    writeFile(join(targetDir, 'pen.config.ts'), configTemplate),
    writeFile(join(targetDir, 'eslint.config.js'), eslintConfigTemplate),
  ])
}
