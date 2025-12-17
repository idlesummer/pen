import path from 'path'
import fs from 'fs'
import { compileAll } from '@/cli/compiler'

export async function buildCommand() {
  const cwd = process.cwd()
  const appDir = path.join(cwd, 'src', 'app')
  const outDir = path.join(cwd, 'dist', 'app')
  
  if (!fs.existsSync(appDir)) {
    console.error('Error: src/app/ directory not found')
    process.exit(1)
  }
  
  console.log('🔨 Building for production...\n')
  
  try {
    const { screenFiles, layoutFiles } = await compileAll(appDir, outDir, true)
    
    if (screenFiles.length === 0) {
      console.error('No screen files found in src/app/')
      process.exit(1)
    }
    
    console.log('✓ Build complete:')
    console.log(`  ${screenFiles.length} screen(s) compiled`)
    console.log(`  ${layoutFiles.length} layout(s) compiled`)
    console.log(`Output: ${outDir}`)
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
