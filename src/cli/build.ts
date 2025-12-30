import { buildFileTree, buildRouteTree, buildRouteManifest } from '@/core/build'

interface BuildOptions {
  dir?: string
}

/**
 * Builds the route manifest from the app directory.
 * Prints the manifest to console.
 */
export async function build(options: BuildOptions = {}) {
  const appDir = options.dir || './src/app'
  
  console.log('🔨 Building routes...')
  console.log(`   App directory: ${appDir}`)
  console.log()
  
  try {
    // Step 1: Scan filesystem
    console.log('📁 Scanning filesystem...')
    const fileTree = buildFileTree(appDir)
    
    if (!fileTree) {
      console.error('❌ Error: No files found in', appDir)
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
    const manifest = buildRouteManifest(routeTree)
    
    // Step 4: Print manifest
    console.log()
    console.log('✅ Build complete!')
    console.log()
    console.log('Manifest:')
    console.log(JSON.stringify(manifest, null, 2))
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}
