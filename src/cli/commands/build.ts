import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, extname } from 'path'

import { rolldown } from 'rolldown'
import { fdir } from 'fdir'

import pc from 'picocolors'

import { VERSION } from '@/core/constants'
import { pipe } from '@/core/build-tools/pipeline'
import * as format from '@/core/build-tools/format'
import { buildFileTree, buildSegmentTree, buildRouteManifest, buildComponentMap } from '@/core/route-builder'
import type { FileNode, SegmentNode, RouteManifest } from '@/core/route-builder'
// import { delay } from '@/lib/delay'

export interface BuildOptions {
  dir?: string
  output?: string
}

interface BuildContext extends Record<string, unknown> {
  appDir: string
  outputDir: string
  fileTree?: FileNode
  routeTree?: SegmentNode
  manifest?: RouteManifest
}

export async function buildCommand(options: BuildOptions = {}) {
  const appDir = options.dir ?? './src/app'
  const outputDir = options.output ?? './.pen/build'

  console.log(pc.cyan('  Starting production build...\n'))
  console.log(pc.bold(`  ✎  pen v${VERSION}\n`))
  console.log(pc.dim( `  entry:  ${appDir}`))
  console.log(pc.dim( '  target: node24'))
  console.log(pc.dim( `  output: ${outputDir}`))
  console.log()

  try {
    const pipeline = pipe<BuildContext>([
      {
        name: 'Scanning filesystem',
        onSuccess: (_, ctx) => `Scanned filesystem (${format.duration(ctx.duration)})`,
        run: async (ctx) => {
          // await delay(800)  // Simulate work
          const fileTree = buildFileTree(ctx.appDir)
          return { fileTree }
        },
      },
      {
        name: 'Building route tree',
        onSuccess: (_, ctx) => `Built route tree (${format.duration(ctx.duration)})`,
        run: async (ctx) => {
          // await delay(600)  // Simulate work
          const routeTree = buildSegmentTree(ctx.fileTree!) // Safe: set by previous task
          // console.log(routeTree)
          return { routeTree }
        },
      },
      {
        name: 'Generating manifest',
        onSuccess: (_, ctx) => `Generated manifest (${format.duration(ctx.duration)})`,
        run: async (ctx) => {
          // await delay(500)  // Simulate work
          const manifest = buildRouteManifest(ctx.routeTree!) // Safe: set by previous task
          return { manifest }
        },
      },
      {
        name: 'Writing manifest',
        onSuccess: (_, ctx) => `Saved manifest (${format.duration(ctx.duration)})`,
        run: async (ctx) => {
          // await delay(400)  // Simulate work
          const manifestPath = join(ctx.outputDir, 'manifest.json')
          const manifestJson = JSON.stringify(ctx.manifest, null, 2)
          mkdirSync(ctx.outputDir, { recursive: true })
          writeFileSync(manifestPath, manifestJson, 'utf-8')
        },
      },
      {
        name: 'Generating component map',
        onSuccess: (_, ctx) => `Generated component map (${format.duration(ctx.duration)})`,
        run: async (ctx) => {
          // await delay(450)  // Simulate work
          const componentsCode = buildComponentMap(ctx.manifest!) // Safe: set by previous task
          const componentsPath = join(ctx.outputDir, 'components.js')
          writeFileSync(componentsPath, componentsCode, 'utf-8')
        },
      },
      {
        name: 'Compiling application',
        onSuccess: (_, ctx) => `Compiled application (${format.duration(ctx.duration)})`,
        onError: (err) => `Compilation failed: ${err.message}`,
        run: async (ctx) => {
          // await delay(1200)  // Simulate work
          // const appFiles = globSync(join(ctx.appDir, '/**/*.{js,jsx,ts,tsx}'))
          const appFiles = new fdir()
            .withFullPaths()
            .filter((path) => /\.(js|jsx|ts|tsx)$/.test(path))
            .crawl(ctx.appDir)
            .sync()

          const build = await rolldown({
            input: appFiles,
            cwd: ctx.appDir,
            platform: 'node',
            resolve: {
              extensions: ['.ts', '.tsx', '.js', '.jsx'],
            },
            jsx: {
              mode: 'automatic',
              importSource: 'react',
            },
            plugins: [
              {
                name: 'add-js-extensions',
                transform(code, id) {
                  // Only process TypeScript and JavaScript files
                  if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
                    return null
                  }

                  // Rewrite relative imports to add .js extensions
                  // Handles: import/export ... from './path' and import './path'
                  const contents = code.replace(
                    /(from\s+|import\s+|export\s+\*\s+from\s+)(['"])(\.\.[/\\]|\.\/)(.*?)(['"])/g,
                    (match, prefix, openQuote, relativePrefix, importPath, closeQuote) => {
                      // Skip if already has an extension
                      if (/\.(js|jsx|ts|tsx|json)$/.test(importPath)) {
                        return match
                      }
                      // Add .js extension
                      return prefix + openQuote + relativePrefix + importPath + '.js' + closeQuote
                    }
                  )

                  return {
                    code: contents,
                  }
                },
              },
            ],
          })

          await build.write({
            dir: join(ctx.outputDir, 'app'),
            format: 'esm',
            sourcemap: true,
            minify: true,
            preserveModules: true,
            preserveModulesRoot: ctx.appDir,
          })
        },
      },
    ])

    const { duration } = await pipeline.run({ appDir, outputDir })
    console.log()
    console.log(format.fileList(outputDir, '**/*.{js,json}'))
    console.log()
    console.log(`${pc.green('✓')} Built in ${pc.bold(format.duration(duration))}`)
    console.log()
  }

  catch (error) {
    console.log()
    console.error(`${pc.red('✗')} Build failed`)
    console.log()

    const message = error instanceof Error ? error.message : String(error)
    console.error(pc.red(message))
    console.log()
    process.exit(1)
  }
}
