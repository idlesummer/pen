import fs from 'fs/promises'
import path from 'path'
import url from 'url'

export async function getScreenFiles(rootDir: string) {
  const screenPattern = /^screen\.(tsx|jsx)$/i
  const files: string[] = []
  const queue: string[] = [rootDir]
  
  while (queue.length) {
    const currDir = queue.shift()!
    const dirents = await fs.readdir(currDir, { withFileTypes: true })
    
    for (const dirent of dirents) {
      const filePath = path.join(currDir, dirent.name)
      
      if (dirent.isDirectory()) {
        if (!dirent.name.startsWith('_'))
          queue.push(filePath)
      }
      else if (dirent.isFile() && screenPattern.test(dirent.name))
        files.push(filePath)
    }
  }
  
  return files
}

export async function loadAppFiles(appDir: string) {
  const filePaths = await getScreenFiles(appDir)
  const modules = []
  
  for (const filePath of filePaths) {
    const fileUrl = url.pathToFileURL(filePath).href + `?t=${Date.now()}`
    const module = await import(fileUrl)
    
    const relativePath = filePath.replace(appDir, '').replace(/^[/\\]/, '')
    console.log(`Loaded: ${relativePath}`)
    
    if (module.default)
      console.log(`  ${module.default}`)
    
    modules.push(module)
  }
  
  return modules
}
