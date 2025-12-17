import fs from 'fs/promises'
import path from 'path'

const SCREEN_PATTERN = /^screen\.(tsx|jsx|ts|js)$/i
const LAYOUT_PATTERN = /^layout\.(tsx|jsx|ts|js)$/i
const ROUTE_GROUP_PATTERN = /^\(.*\)$/

export async function getScreenFiles(rootDir: string) {
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
      else if (dirent.isFile() && SCREEN_PATTERN.test(dirent.name))
        files.push(filePath)
    }
  }
  
  return files
}

export async function getLayoutFiles(rootDir: string) {
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
      else if (dirent.isFile() && LAYOUT_PATTERN.test(dirent.name))
        files.push(filePath)
    }
  }
  
  return files
}

export function getRoutePath(filePath: string, appDir: string): string {
  const relativePath = path.relative(appDir, filePath)
  const dirPath = path.dirname(relativePath)
  
  // Remove route groups from path
  const segments = dirPath.split(path.sep).filter((segment) => {
    return !ROUTE_GROUP_PATTERN.test(segment)
  })
  
  return '/' + segments.join('/')
}

// Get layouts for a specific route path (in order from root to leaf)
export function getLayoutsForRoute(routePath: string, layoutFiles: string[], appDir: string): string[] {
  const layouts: Array<{ path: string, depth: number }> = []
  
  for (const layoutFile of layoutFiles) {
    const layoutRoutePath = getRoutePath(path.dirname(layoutFile), appDir)
    
    // Check if this layout applies to the route
    if (routePath.startsWith(layoutRoutePath) || layoutRoutePath === '/') {
      const depth = layoutRoutePath === '/' ? 0 : layoutRoutePath.split('/').length
      layouts.push({ path: layoutFile, depth })
    }
  }
  
  // Sort by depth (root layout first)
  return layouts.sort((a, b) => a.depth - b.depth).map(l => l.path)
}
