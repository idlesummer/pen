import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import { globSync } from 'glob'
import { build } from 'esbuild'
import pc from 'picocolors'

import { VERSION } from '@/core/constants'
import { pipe } from '@/core/build-tools/pipeline'
import * as format from '@/core/build-tools/format'
import { buildFileTree, buildRouteTree, buildRouteManifest, buildComponentMap } from '@/core/file-router'
import type { FileNode, RouteNode, RouteManifest } from '@/core/file-router'
import { delay } from '@/lib/delay'

export interface BuildOptions {
  dir?: string
  output?: string
}

interface BuildContext extends Record<string, unknown> {
  appDir: string
  outputDir: string
  fileTree?: FileNode
  routeTree?: RouteNode
  manifest?: RouteManifest
}

export async function buildCommand(options: BuildOptions = {}) {
  const appDir = options.dir || './src/app'
  const outputDir = options.output || './.pen/build'

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
          const routeTree = buildRouteTree(ctx.fileTree!) // Safe: set by previous task
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
          const appFiles = globSync(`${ctx.appDir}/**/*.{ts,tsx}`)
          await build({
            entryPoints: appFiles,
            outdir: join(ctx.outputDir, 'app'),
            outbase: ctx.appDir,
            format: 'esm',
            platform: 'node',
            target: 'node24',
            bundle: false,
          })
        },
      },
    ])

    const { duration } = await pipeline.run({ appDir, outputDir })
    console.log()
    const outputFiles = globSync(`${outputDir}/**/*.{js,json}`)
      .map(file => file.replace(`${outputDir}/`, ''))
    console.log(format.fileList(outputFiles))

    console.log()
    console.log(`${pc.green('✓')} Built in ${pc.bold(format.duration(duration))}`)
    console.log()
  }
  catch (error) {
    console.log()
    console.error(`${pc.red('✗')} Build failed`)
    console.log()

    if (error instanceof Error)
      console.error(pc.red(error.message))

    console.log()
    process.exit(1)
  }
}
