import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { buildFileTree, buildRouteTree, buildManifest } from '@/core/build'
import { buildComponentMap } from '@/cli/codegen'

interface BuildOptions {
  dir?: string
  output?: string
}

/**
 * Builds the route manifest from the app directory.
 * Generates manifest.json file.
 */
export async function build(options: BuildOptions = {}) {
  const appDir = options.dir || './src/app'
  const outputDir = options.output || './.pen'
  
  console.log('🔨 Building routes...')
  console.log(`   App directory: ${appDir}`)
  console.log(`   Output directory: ${outputDir}`)
  console.log()
  
  try {
    // Step 1: Scan filesystem
    console.log('📁 Scanning filesystem...')
    const fileTree = buildFileTree(appDir)
    if ('error' in fileTree) {
      if (fileTree.error === 'NOT_FOUND') {
        console.error('❌ Error: Directory not found:', appDir)
        console.error('   Make sure the path exists')

      } else if (fileTree.error === 'NOT_DIRECTORY') {
        console.error('❌ Error: Path is not a directory:', appDir)
        console.error('   Provide a directory containing your app/ routes')
      }
      process.exit(1)
    }
    
    // Step 2: Build route tree
    console.log('🌳 Building route tree...')
    const routeTree = buildRouteTree(fileTree)
    
    if (!routeTree) {
      console.error('❌ Error: No routes found')
      process.exit(1)
    }
  
    // Step 3: Generate manifest
    console.log('📋 Generating manifest...')
    const manifest = buildManifest(routeTree)
    
    // Step 4: Ensure output directory exists
    if (!existsSync(outputDir))
      mkdirSync(outputDir, { recursive: true })
    
    // Step 5: Write manifest.json
    const manifestPath = join(outputDir, 'manifest.json')
    const manifestJson = JSON.stringify(manifest, null, 2)
    writeFileSync(manifestPath, manifestJson, 'utf-8')
    console.log(`   ✓ Generated ${manifestPath}`)
    
    // Step 6: Generate component map
    console.log('🗺️  Generating component map...')
    const componentsCode = buildComponentMap(manifest)
    const componentsPath = join(outputDir, 'components.ts')
    writeFileSync(componentsPath, componentsCode, 'utf-8')
    console.log(`   ✓ Generated ${componentsPath}`)

    // Step 7: Success summary
    console.log()
    console.log('✅ Build complete!')
    console.log()
    console.log('Generated files:')
    console.log(`   ${manifestPath}`)
    console.log(`   ${componentsPath}`)
    console.log()
    console.log('Routes:')
    for (const url of Object.keys(manifest))
      console.log(`   ${url}`)
  
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}
