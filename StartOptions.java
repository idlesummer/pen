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

  const spinner = ui.spinner('Starting application').start()

  try {
    // Show start info
    ui.info(`URL: ${url}`)
    ui.info(`Manifest: ${manifestPath}`)

    // Step 1: Verify build files exist
    spinner.text = 'Checking build files'
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
    const routeGroups: Record<string, string[]> = {}
    for (const routeUrl of Object.keys(manifest)) {
      const parts = routeUrl.split('/').filter(Boolean)
      const group = parts[0] || 'root'
      routeGroups[group] = routeGroups[group] || []
      routeGroups[group].push(routeUrl)
    }
    ui.tree('Routes:', routeGroups)

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
```

## Example Output

### Build Command
```
⠋ Creating optimized build
 INFO  entry: ./src/app
 INFO  target: node24
 INFO  output: ./.pen/build
⠋ Scanning filesystem
⠋ Building route tree
⠋ Generating manifest
⠋ Writing manifest
⠋ Generating component map
⠋ Compiling application
i .pen/build/components.js                          5.49 kB │ gzip: 2.10 kB
i .pen/build/manifest.json                          3.18 kB │ gzip: 1.07 kB
i .pen/build/app/screen.js                          1.91 kB │ gzip: 0.80 kB
i 3 files, total: 10.58 kB
 SUCCESS  Production build completed!

Routes:
├─ root
│  └─ /
├─ blog
│  └─ /blog/
└─ about
   └─ /about/
```

### Start Command
```
⠋ Starting application
 INFO  URL: /
 INFO  Manifest: ./.pen/build/manifest.json
⠋ Checking build files
⠋ Loading manifest
⠋ Loading components
Routes:
├─ root
│  └─ /
├─ blog
│  └─ /blog/
└─ about
   └─ /about/
 SUCCESS  Application started!

[Your Ink app renders here]