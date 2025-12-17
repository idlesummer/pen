import { join } from 'path'
import { pathToFileURL } from 'url'
import { existsSync } from 'fs'
import { getAllFiles } from '../scanner.js'

export async function startCommand() {
  const cwd = process.cwd()
  const distAppDir = join(cwd, 'dist', 'app')
  
  if (!existsSync(distAppDir)) {
    console.error('Error: dist/app/ directory not found')
    console.error('Run "pkg build" first.')
    process.exit(1)
  }
  
  console.log('🚀 Starting application...\n')
  
  // Load all built files from dist/app/
  const filePaths = await getAllFiles(distAppDir)
  
  for (const filePath of filePaths) {
    const fileUrl = pathToFileURL(filePath).href
    const module = await import(fileUrl)
    
    const relativePath = filePath.replace(distAppDir, '').replace(/^[/\\]/, '')
    console.log(`Running: ${relativePath}`)
    
    if (module.default) {
      if (typeof module.default === 'function') {
        module.default()
      } else {
        console.log(`  ${module.default}`)
      }
    }
  }
  
  console.log('\n✓ Application started')
}
