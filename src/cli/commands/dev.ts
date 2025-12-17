import path from 'path'
import fs from 'fs'
import chokidar from 'chokidar'
import { loadAppFiles } from '../scanner.js'

export async function devCommand() {
  const cwd = process.cwd()
  const appDir = path.join(cwd, 'src', 'app')
  const tempDir = path.join(cwd, '.pen', 'app')
  
  if (!fs.existsSync(appDir)) {
    console.error('Error: src/app/ directory not found')
    process.exit(1)
  }
  
  console.log('🚀 Starting development mode...')
  console.log(`Watching: ${appDir}\n`)
  
  // Initial load
  await loadAppFiles(appDir, tempDir)
  
  // Watch for changes
  const watcher = chokidar.watch(appDir, {
    persistent: true,
    ignoreInitial: true,
  })
  
  watcher.on('add', async (path) => {
    console.log(`\n📝 New file detected: ${path}`)
    console.log('🔄 Recompiling and reloading...\n')
    await loadAppFiles(appDir, tempDir)
  })
  
  watcher.on('change', async (path) => {
    console.log(`\n📝 File changed: ${path}`)
    console.log('🔄 Recompiling and reloading...\n')
    await loadAppFiles(appDir, tempDir)
  })
  
  watcher.on('unlink', async (path) => {
    console.log(`\n🗑️  File deleted: ${path}`)
    console.log('🔄 Recompiling and reloading...\n')
    await loadAppFiles(appDir, tempDir)
  })
  
  console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)')
}
