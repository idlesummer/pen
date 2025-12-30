import fs from 'node:fs'
import { render } from 'ink'
import React from 'react'
import { Router } from '@/core/router/Router'
import type { RouteManifest } from '@/core/build/manifest'

interface StartOptions {
  url?: string
  manifest?: string
}

/**
 * Starts the application with the generated manifest.
 * Renders the router at the specified URL.
 */
export async function start(options: StartOptions = {}) {
  const url = options.url || '/'
  const manifestPath = options.manifest || './.pen/manifest.json'
  
  console.log('🚀 Starting application...')
  console.log(`   URL: ${url}`)
  console.log(`   Manifest: ${manifestPath}`)
  console.log()
  
  try {
    // Step 1: Check manifest exists
    if (!fs.existsSync(manifestPath)) {
      console.error('❌ Error: Manifest not found')
      console.error('   Run `pen build` first to generate the manifest')
      process.exit(1)
    }
    
    // Step 2: Load manifest
    const manifestJson = fs.readFileSync(manifestPath, 'utf-8')
    const manifest: RouteManifest = JSON.parse(manifestJson)
    
    // Step 3: Load components (TODO: auto-generate this)
    console.error('❌ Error: Component loading not implemented yet')
    console.error('   Need to implement component map generation')
    process.exit(1)
    
    // Step 4: Render (will implement after components)
    // render(<Router url={url} manifest={manifest} components={components} />)
    
  } catch (error) {
    console.error('❌ Start failed:', error)
    process.exit(1)
  }
}
