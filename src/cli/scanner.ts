import fs from 'fs/promises'
import path from 'path'


export async function getScreenFiles(rootDir: string) {
  const screenPattern = /^screen\.(tsx|jsx|ts|js)$/i
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

export function getRoutePath(filePath: string, appDir: string): string {
  const relativePath = path.relative(appDir, filePath)
  const dirPath = path.dirname(relativePath)
  const routeGroupPattern = /^\(.*\)$/
  
  // Remove route groups from path
  const segments = dirPath.split(path.sep).filter((segment) => {
    // Keep segments that don't start with ( or are not just (name)
    return !segment.match(routeGroupPattern)
  })
  
  return '/' + segments.join('/')
}
