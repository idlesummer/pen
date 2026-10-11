import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PACKAGE_NAME, VERSION, INK_VERSION, REACT_VERSION } from '@/lib/constants'
import configTemplate from './templates/pen.config.ts.txt' with { type: 'text' }
import pageTemplate from './templates/page.tsx.txt' with { type: 'text' }
import packageTemplate from './templates/package.json.txt' with { type: 'text' }
import gitignoreTemplate from './templates/.gitignore.txt' with { type: 'text' }

const PROJECT_NAME_TOKEN = '__PEN_PROJECT_NAME__'
const PACKAGE_NAME_TOKEN = '__PEN_PACKAGE_NAME__'
const PACKAGE_VERSION_TOKEN = '__PEN_VERSION__'
const INK_VERSION_TOKEN = '__INK_VERSION__'
const REACT_VERSION_TOKEN = '__INK_VERSION__'
const REFERENCE_DIRECTIVE = /^\/\/\/.*\n/

function createPackageJson(projectName: string) {
  // return JSON.stringify({
  //   name,
  //   version: '0.0.0',
  //   private: true,
  //   type: 'module',
  //   scripts: {
  //     dev: 'pen dev',
  //     build: 'pen build',
  //     start: 'pen start',
  //   },
  //   dependencies: {
  //     [PACKAGE_NAME]: `^${VERSION}`,
  //     ink: '^7.1.1',
  //     react: '^19.2.8',
  //   },
  // }, null, 2)

  return packageTemplate
    .replaceAll(PROJECT_NAME_TOKEN, projectName)
    .replaceAll(PACKAGE_NAME_TOKEN, PACKAGE_NAME)
    .replaceAll(PACKAGE_VERSION_TOKEN, VERSION)
    .replaceAll(INK_VERSION_TOKEN, INK_VERSION)
    .replaceAll(REACT_VERSION_TOKEN, REACT_VERSION)
}

function createTsconfig() {
  return JSON.stringify({
    compilerOptions: {
      module: 'esnext',
      moduleResolution: 'bundler',
      target: 'esnext',
      noUncheckedIndexedAccess: true,
      strict: true,
      jsx: 'react-jsx',
      verbatimModuleSyntax: true,
      isolatedModules: true,
      noUncheckedSideEffectImports: true,
      moduleDetection: 'force',
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src'],
  }, null, 2)
}

function createPenConfig() {
  return configTemplate
    .replace(REFERENCE_DIRECTIVE, '')
    .replaceAll(PACKAGE_NAME_TOKEN, PACKAGE_NAME)
}

/** Writes a fresh pen project's files into `targetDir`. */
export async function createProjectScaffold(targetDir: string, name: string) {
  await mkdir(join(targetDir, 'src/app'), { recursive: true })
  await Promise.all([
    await writeFile(join(targetDir, 'src/app/page.tsx'), pageTemplate),
    await writeFile(join(targetDir, 'package.json'), createPackageJson(name)),
    await writeFile(join(targetDir, 'tsconfig.json'), createTsconfig()),
    await writeFile(join(targetDir, '.gitignore'), gitignoreTemplate),
    await writeFile(join(targetDir, 'pen.config.ts'), createPenConfig()),
  ])
}
