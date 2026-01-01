import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'  // ← Add this
import { createElement } from 'react'
import { render } from 'ink'
import { Router } from '@/core/router/Router'
import type { RouteManifest } from '@/core/file-router/route-manifest'

interface StartOptions {
  url?: string
  manifest?: string
}

/**
 * Starts the application with the generated manifest.
 * Renders the router at the specified URL.
 */
export async function startCommand(options: StartOptions = {}) {
  const url = options.url || '/'
  const manifestPath = options.manifest || './.pen/build/manifest.json'
  const componentsPath = './.pen/build/components.js'
  
  console.log('🚀 Starting application...')
  console.log(`   URL: ${url}`)
  console.log(`   Manifest: ${manifestPath}`)
  console.log()
  
  try {
    // Step 1: Check manifest exists
    if (!existsSync(manifestPath)) {
      console.error('❌ Error: Manifest not found')
      console.error('   Run `pen build` first to generate the manifest')
      process.exit(1)
    }
    
    // Step 2: Check components exist
    if (!existsSync(componentsPath)) {
      console.error('❌ Error: Component map not found')
      console.error('   Run `pen build` first to generate components')
      process.exit(1)
    }
    
    // Step 3: Load manifest
    const manifestJson = readFileSync(manifestPath, 'utf-8')
    const manifest: RouteManifest = JSON.parse(manifestJson)
    
    // Step 4: Load components (convert to file:// URL for Windows)
    const absoluteComponentsPath = resolve(process.cwd(), componentsPath)
    const componentFileUrl = pathToFileURL(absoluteComponentsPath).href
    const { components } = await import(componentFileUrl)
    
    // Step 5: Render
    render(
      createElement(Router, {
        url,
        manifest,
        components,
      }),
    )

  } catch (error) {
    console.error('❌ Start failed:', error)
    process.exit(1)
  }
}
