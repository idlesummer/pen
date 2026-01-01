import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import ora from 'ora'
import { globSync } from 'glob'
import { build } from 'esbuild'
import { buildFileTree, buildRouteTree, buildRouteManifest, buildComponentMap } from '@/core/file-router'

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
  const spinner = ora()

  console.log('🔨 Building routes...')
  console.log(`   App directory: ${appDir}`)
  console.log(`   Output directory: ${outputDir}`)
  console.log()

  try {
    // Test spinner
    spinner.start('Testing spinner...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    spinner.succeed('Spinner works!')

    // Step 1: Scan filesystem
    spinner.start('Scanning filesystem...')
    const fileTree = buildFileTree(appDir)
    spinner.succeed('Scanned filesystem')

    // Step 2: Build route tree
    spinner.start('Building route tree...')
    const routeTree = buildRouteTree(fileTree)
    spinner.succeed('Built route tree')

    // Step 3: Generate manifest
    spinner.start('Generating manifest...')
    const manifest = buildRouteManifest(routeTree)

    const manifestPath = join(outputDir, 'manifest.json')
    const manifestJson = JSON.stringify(manifest, null, 2)
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(manifestPath, manifestJson, 'utf-8')
    spinner.succeed('Generated manifest')

    // Step 4: Generate component map
    spinner.start('Generating component map...')
    const componentsCode = buildComponentMap(manifest)
    const componentsPath = join(outputDir, 'components.js')
    writeFileSync(componentsPath, componentsCode, 'utf-8')
    spinner.succeed('Generated component map')

    // Step 5: Compile
    spinner.start('Compiling application...')
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
    spinner.succeed('Compiled application')

    // Success summary
    console.log()
    console.log('✅ Build complete!')
    console.log()
    console.log('Routes:')
    for (const url of Object.keys(manifest))
      console.log(`   ${url}`)


  } catch (error) {
    console.error()
    console.error('❌ Build failed')

    if (error instanceof Error)     // Standard errors (has message property)
      console.error(error.message)
    else                            // Non-standard throws (strings, objects, primitives, etc.)
      console.error(error)

    console.error()
    process.exit(1)
  }
}
