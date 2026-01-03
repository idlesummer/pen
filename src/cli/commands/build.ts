// cli/commands/build.ts
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import { build } from 'esbuild'
import { buildFileTree, buildRouteTree, buildRouteManifest, buildComponentMap } from '@/core/file-router'
import * as ui from '@/core/cli-kit'

export interface BuildOptions {
  dir?: string
  output?: string
}

/**
 * Builds the route manifest from the app directory.
 * Generates manifest.json and compiles the application.
 */
export async function buildCommand(options: BuildOptions = {}) {
  const appDir = options.dir || './src/app'
  const outputDir = options.output || './.pen/build'

  // Show info BEFORE starting spinner
  ui.info(`entry: ${appDir}`)
  ui.info('target: node24')
  ui.info(`output: ${outputDir}`)
  console.log()

  const spinner = ui.spinner('Scanning filesystem').start()

  try {
    // Step 1: Scan filesystem
    const fileTree = buildFileTree(appDir)

    // Step 2: Build route tree
    spinner.text = 'Building route tree'
    const routeTree = buildRouteTree(fileTree)

    // Step 3: Generate manifest
    spinner.text = 'Generating manifest'
    const manifest = buildRouteManifest(routeTree)

    // Step 4: Write manifest.json
    spinner.text = 'Writing manifest'
    const manifestPath = join(outputDir, 'manifest.json')
    const manifestJson = JSON.stringify(manifest, null, 2)
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(manifestPath, manifestJson, 'utf-8')

    // Step 5: Generate component map
    spinner.text = 'Generating component map'
    const componentsCode = buildComponentMap(manifest)
    const componentsPath = join(outputDir, 'components.js')
    writeFileSync(componentsPath, componentsCode, 'utf-8')

    // Step 6: Compile with esbuild
    spinner.text = 'Compiling application'
    const appFiles = globSync(`${appDir}/**/*.{ts,tsx}`)

    await build({
      entryPoints: appFiles,
      outdir: join(outputDir, 'app'),
      outbase: appDir,
      format: 'esm',
      platform: 'node',
      target: 'node24',
      bundle: false,
    })

    spinner.stop()

    // Show output files
    const outputFiles = globSync(`${outputDir}/**/*.{js,json}`)
    ui.files(outputFiles)
    console.log()
    ui.success('Production build completed!')

    // Show routes
    console.log()
    const routes = Object.keys(manifest).sort()

    console.log('Routes:')
    ui.tree({ '': routes })

  } catch (error) {
    spinner.fail('Build failed')
    console.error()

    if (error instanceof Error) {
      ui.error(error.message)
    } else {
      console.error(error)
    }

    console.error()
    process.exit(1)
  }
}
