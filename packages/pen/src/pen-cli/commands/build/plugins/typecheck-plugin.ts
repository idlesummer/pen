import type { FormatDiagnosticsHost } from 'typescript'
import type { Plugin } from 'vite'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/** Resolves the project's locally installed TypeScript module. */
async function resolveTypescript(projectDir: string): Promise<typeof import('typescript') | undefined> {
  try {
    const require = createRequire(join(projectDir, 'package.json'))
    const tsPath = require.resolve('typescript')
    const tsModule = await import(tsPath)
    return tsModule.default
  }
  catch {
    return
  }
}

/** Runs the project's TypeScript compiler and returns formatted errors, if any. */
async function runTypecheck(projectDir: string): Promise<string | undefined> {
  const ts = await resolveTypescript(projectDir)
  if (!ts) return

  const configPath = ts.findConfigFile(projectDir, ts.sys.fileExists, 'tsconfig.json')
  if (!configPath) return

  const formatHost: FormatDiagnosticsHost = {
    getCurrentDirectory: () => projectDir,
    getCanonicalFileName: file => file,
    getNewLine: () => '\n',
  }
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile).config
  if (configFile.error)
    return ts.formatDiagnosticsWithColorAndContext([configFile.error], formatHost)

  const { fileNames, options, errors: diagnostics } = ts.parseJsonConfigFileContent(configFile, ts.sys, projectDir)
  const program = ts.createProgram(fileNames, options)
  if (diagnostics.push(...ts.getPreEmitDiagnostics(program)))
    return ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
}

/** Type-checks the project before bundling, using its own TypeScript installation. */
export function penTypecheck(): Plugin {
  return {
    name: 'pen:typecheck',

    applyToEnvironment(environment) {
      return environment.name === 'ssr'
    },
    buildStart: {
      sequential: true,

      async handler() {
        const projectDir = this.environment.config.root
        const typeErrors = await runTypecheck(projectDir)
        if (typeErrors) this.error(typeErrors)
      },
    },
  }
}
