import { join } from 'path'
import { mkdirSync, writeFileSync, globSync } from 'fs'
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
  
  console.log('🔨 Building routes...')
  console.log(`   App directory: ${appDir}`)
  console.log(`   Output directory: ${outputDir}`)
  console.log()
  
  try {
    // Step 1: Scan filesystem
    console.log('📁 Scanning filesystem...')
    const fileTree = buildFileTree(appDir)
    
    // Step 2: Build route tree
    console.log('🌳 Building route tree...')
    const routeTree = buildRouteTree(fileTree)
  
    // Step 3: Generate manifest
    console.log('📋 Generating manifest...')
    const manifest = buildRouteManifest(routeTree)
    
    // Step 4: Write manifest.json
    const manifestPath = join(outputDir, 'manifest.json')
    const manifestJson = JSON.stringify(manifest, null, 2)
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(manifestPath, manifestJson, 'utf-8')
    console.log(`   ✓ Generated ${manifestPath}`)
    
    // Step 5: Generate component map
    console.log('🗺️  Generating component map...')
    const componentsCode = buildComponentMap(manifest)
    const componentsPath = join(outputDir, 'components.js')
    writeFileSync(componentsPath, componentsCode, 'utf-8')
    console.log(`   ✓ Generated ${componentsPath}`)

    // Step 6: Compile with esbuild
    console.log('⚙️  Compiling application...')
    
    // Find all TypeScript files in app/
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
    
    console.log(`   ✓ Compiled to ${join(outputDir, 'app')}`)

    // Step 7: Success summary
    console.log()
    console.log('✅ Build complete!')
    console.log()
    console.log('Generated files:')
    console.log(`   ${manifestPath}`)
    console.log(`   ${componentsPath}`)
    console.log(`   ${join(outputDir, 'app')}`)
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
