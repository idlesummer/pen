// cli/commands/build.ts
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import { build } from 'esbuild'
import { buildFileTree, buildRouteTree, buildRouteManifest, buildComponentMap } from '@/core/file-router'
import * as ui from '@/core/ui'

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

  const spinner = ui.spinner('Creating optimized build').start()
  console.log()

  try {
    // Show build info
    ui.info(`entry: ${appDir}`)
    ui.info('target: node24')
    ui.info(`output: ${outputDir}`)

    // Step 1: Scan filesystem
    spinner.text = 'Scanning filesystem'
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

    // Show output files with sizes
    const outputFiles = globSync(`${outputDir}/**/*.{js,json}`)
    ui.files(outputFiles)

    ui.success('Production build completed!')

    // Show routes as tree
    console.log()
    const routeGroups: Record<string, string[]> = {}
    for (const url of Object.keys(manifest)) {
      const parts = url.split('/').filter(Boolean)
      const group = parts[0] || 'root'
      routeGroups[group] = routeGroups[group] || []
      routeGroups[group].push(url)
    }
    ui.tree('Routes:', routeGroups)

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
