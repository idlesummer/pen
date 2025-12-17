import { readdir } from 'fs/promises'
import { join } from 'path'
import { pathToFileURL } from 'url'

export async function getAllFiles(rootDir: string) {
  const files: string[] = []
  const queue: string[] = [rootDir]
  
  while (queue.length) {
    const currentDir = queue.shift()!
    const dirents = await readdir(currentDir, { withFileTypes: true })
    
    for (const dirent of dirents) {
      const filePath = join(currentDir, dirent.name)
      
      if (dirent.isDirectory())
        queue.push(filePath)

      else if (dirent.isFile() && /\.(ts|js)$/.test(dirent.name))
        files.push(filePath)
    }
  }
  
  return files
}

export async function loadAppFiles(appDir: string) {
  const filePaths = await getAllFiles(appDir)
  const modules = []
  
  for (const filePath of filePaths) {
    const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`
    const module = await import(fileUrl)
    
    const relativePath = filePath.replace(appDir, '').replace(/^[/\\]/, '')
    console.log(`Loaded: ${relativePath}`)
    
    if (module.default) {
      if (typeof module.default === 'function') {
        module.default()
      } else {
        console.log(`  ${module.default}`)
      }
    }
    
    modules.push(module)
  }
  
  return modules
}
