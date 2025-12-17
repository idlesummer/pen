import url from 'url'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { compileAll } from '@/cli/compiler'
import { getRoutePath, getLayoutsForRoute } from '@/cli/scanner'

export async function loadAppFiles(appDir: string, tempDir: string) {
  const { screenFiles, layoutFiles } = await compileAll(appDir, tempDir)
  
  // Import all layouts
  const layoutModules = new Map<string, any>()
  for (const layoutFile of layoutFiles) {
    const fileUrl = url.pathToFileURL(layoutFile).href + `?t=${Date.now()}`
    const module = await import(fileUrl)
    layoutModules.set(layoutFile, module)
  }
  
  // Process each screen
  for (const screenFile of screenFiles) {
    const fileUrl = url.pathToFileURL(screenFile).href + `?t=${Date.now()}`
    const screenModule = await import(fileUrl)
    
    const routePath = getRoutePath(screenFile, tempDir)
    console.log(`\nLoaded: ${routePath}`)
    
    // Get layouts for this route
    const layouts = getLayoutsForRoute(routePath, layoutFiles, tempDir)
    
    // Compose layouts from innermost to outermost
    let content = screenModule.default
    
    // If screen exports a string, wrap in React element
    if (typeof content === 'string') {
      content = React.createElement('div', null, content)
    }
    
    // Wrap with layouts (innermost first)
    for (let i = layouts.length - 1; i >= 0; i--) {
      const layoutModule = layoutModules.get(layouts[i])
      if (layoutModule?.default) {
        const Layout = layoutModule.default
        content = React.createElement(Layout, null, content)
      }
    }
    
    // Render to string
    const html = renderToString(content)
    console.log(html)
  }
}
