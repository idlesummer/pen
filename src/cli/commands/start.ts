// cli/commands/start.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { createElement } from 'react'
import { render } from 'ink'
import pc from 'picocolors'
import { App } from '../../index.js'
import type { RouteManifest } from '@/core/route-builder/route-manifest'

export interface StartOptions {
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

  try {
    // Load everything silently
    const manifestJson = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestJson) as RouteManifest

    const componentsAbsPath = resolve(process.cwd(), componentsPath)
    const componentFileUrl = pathToFileURL(componentsAbsPath).href
    const { components } = await import(componentFileUrl)

    // Render with App component
    const element = createElement(App, {
      initialUrl: url,
      manifest,
      components,
    })
    render(element)
  }

  catch (error) {
    console.error(pc.red('✗') + ' Failed to start')
    if (error instanceof Error)
      console.error(pc.red(error.message))
    process.exit(1)
  }
}
