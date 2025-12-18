import path from 'path'
import url from 'url'
import fs from 'fs'
import React from 'react'
import type { ComponentType, PropsWithChildren } from 'react'
import { renderToString } from 'react-dom/server'
import { getScreenFiles, getLayoutFiles, getRoutePath, getLayoutsForScreen } from '@/cli/scanner'

export async function startCommand() {
  const cwd = process.cwd()
  const distAppDir = path.join(cwd, 'dist', 'app')
  
  if (!fs.existsSync(distAppDir)) {
    console.error('Error: dist/app/ directory not found')
    console.error('Run "pen build" first.')
    process.exit(1)
  }
  
  console.log('🚀 Starting application...\n')
  
  const screenFiles = await getScreenFiles(distAppDir)
  const layoutFiles = await getLayoutFiles(distAppDir)
  
  // Import all layouts
  const layoutModules = new Map<string, ComponentType<PropsWithChildren>>()
  for (const layoutFile of layoutFiles) {
    const fileUrl = url.pathToFileURL(layoutFile).href
    const module = await import(fileUrl)
    layoutModules.set(layoutFile, module.default)
  }
  
  // Process each screen
  for (const screenFile of screenFiles) {
    const fileUrl = url.pathToFileURL(screenFile).href
    const screenModule = await import(fileUrl)
    
    const routePath = getRoutePath(screenFile, distAppDir)
    console.log(`Route: ${routePath}`)
    
    // Get layouts for this screen file
    const layouts = getLayoutsForScreen(screenFile, layoutFiles, distAppDir)
    
    // Screen must export a React component
    let content = screenModule.default
    
    // If it's a function, create an element from it
    if (typeof content === 'function') {
      content = React.createElement(content)
    }
    
    // Wrap with layouts (innermost first)
    for (let i = layouts.length - 1; i >= 0; i--) {
      const Layout = layoutModules.get(layouts[i])
      if (Layout) {
        content = React.createElement(Layout, null, content)
      }
    }
    
    // Render to string
    const html = renderToString(content)
    console.log(html)
    console.log()
  }
  
  console.log('✓ Application started')
}
