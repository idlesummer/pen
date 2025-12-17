import path from 'path'
import url from 'url'
import fs from 'fs'
import { getScreenFiles, getRoutePath } from '@/cli/scanner.js'


export async function startCommand() {
  const cwd = process.cwd()
  const distAppDir = path.join(cwd, 'dist', 'app')
  
  if (!fs.existsSync(distAppDir)) {
    console.error('Error: dist/app/ directory not found')
    console.error('Run "pen build" first.')
    process.exit(1)
  }
  
  console.log('🚀 Starting application...\n')
  
  const filePaths = await getScreenFiles(distAppDir)
  
  for (const filePath of filePaths) {
    const fileUrl = url.pathToFileURL(filePath).href
    const module = await import(fileUrl)
    
    const routePath = getRoutePath(filePath, distAppDir)
    console.log(`Running: ${routePath}`)
    
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
