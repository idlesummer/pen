// cli/commands/start.ts
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { createElement } from 'react'
import { render } from 'ink'
import { Router } from '@/core/router/Router'
import * as ui from '@/core/ui'
import type { RouteManifest } from '@/core/file-router/route-manifest'

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

  ui.info(`URL: ${url}`)
  ui.info(`Manifest: ${manifestPath}`)
  console.log()

  const spinner = ui.spinner('Checking build files').start()

  try {
    // Step 1: Verify build files exist
    if (!existsSync(manifestPath)) {
      throw new Error('Manifest not found. Run `pen build` first.')
    }
    if (!existsSync(componentsPath)) {
      throw new Error('Component map not found. Run `pen build` first.')
    }

    // Step 2: Load manifest
    spinner.text = 'Loading manifest'
    const manifestJson = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestJson) as RouteManifest

    // Step 3: Load components
    spinner.text = 'Loading components'
    const componentsAbsPath = resolve(process.cwd(), componentsPath)
    const componentFileUrl = pathToFileURL(componentsAbsPath).href
    const { components } = await import(componentFileUrl)

    spinner.stop()

    // Show loaded routes
    const routes = Object.keys(manifest).sort()
    ui.tree({ '': routes })  // ← Changed to unified shape

    ui.success('Application started!')
    console.log()

    // Step 4: Render application
    const element = createElement(Router, { url, manifest, components })
    render(element)

  } catch (error) {
    spinner.fail('Start failed')
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
