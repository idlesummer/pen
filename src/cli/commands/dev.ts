import { join } from 'path'
import { existsSync } from 'fs'
import chokidar from 'chokidar'
import { loadAppFiles } from '../scanner.js'

export async function devCommand() {
  const cwd = process.cwd()
  const appDir = join(cwd, 'src', 'app')
  
  if (!existsSync(appDir)) {
    console.error('Error: src/app/ directory not found')
    process.exit(1)
  }
  
  console.log('🚀 Starting development mode...')
  console.log(`Watching: ${appDir}\n`)
  
  // Initial load
  await loadAppFiles(appDir)
  
  // Watch for changes
  const watcher = chokidar.watch(appDir, {
    persistent: true,
    ignoreInitial: true,
  })
  
  watcher.on('add', async (path) => {
    console.log(`\n📝 New file detected: ${path}`)
    console.log('🔄 Reloading app files...\n')
    await loadAppFiles(appDir)
  })
  
  watcher.on('change', async (path) => {
    console.log(`\n📝 File changed: ${path}`)
    console.log('🔄 Reloading app files...\n')
    await loadAppFiles(appDir)
  })
  
  watcher.on('unlink', async (path) => {
    console.log(`\n🗑️  File deleted: ${path}`)
    console.log('🔄 Reloading app files...\n')
    await loadAppFiles(appDir)
  })
  
  console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)')
}
