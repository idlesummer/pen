import type { FormatDiagnosticsHost } from 'typescript'
import type { Plugin } from 'vite'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/**
 * Resolves the project's own locally installed `typescript` package, so
 * type checking always runs against the user's own TypeScript version and
 * tsconfig - never a version pen itself depends on.
 *
 * @param projectDir - Project directory to resolve `typescript` from.
 * @returns The resolved `typescript` module, or `undefined` if the
 * project has no `typescript` installed.
 */
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

/** Type-checks the project using the resolved TypeScript's own compiler
 *  API, so errors come from the exact TypeScript version and config the
 *  editor already uses. Returns formatted diagnostic output on failure,
 *  or `undefined` if it passed or the project has no TypeScript installed. */
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

/**
 * Type-checks the project before the real build starts.
 *
 * Runs only in the SSR environment. Marked `sequential` so a future
 * buildStart hook on another plugin can never silently race this one -
 * Vite dispatches buildStart in parallel across plugins by default.
 */
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
