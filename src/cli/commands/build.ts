import { join } from 'path'
import { existsSync } from 'fs'
import * as esbuild from 'esbuild'
import { getScreenFiles } from '../scanner.js'

export async function buildCommand() {
  const cwd = process.cwd()
  const appDir = join(cwd, 'src', 'app')
  const outDir = join(cwd, 'dist')
  
  if (!existsSync(appDir)) {
    console.error('Error: src/app/ directory not found')
    process.exit(1)
  }
  
  console.log('🔨 Building for production...\n')
  
  // Get all app files
  const filePaths = await getScreenFiles(appDir)
  
  if (filePaths.length === 0) {
    console.error('No files found in src/app/')
    process.exit(1)
  }
  
  console.log(`Found ${filePaths.length} file(s) to build\n`)
  
  try {
    await esbuild.build({
      entryPoints: filePaths,
      outdir: outDir,
      format: 'esm',
      platform: 'node',
      target: 'node24',
      bundle: false,
      outbase: join(cwd, 'src'),
    })
    
    console.log(`✓ Build complete: ${outDir}`)
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
