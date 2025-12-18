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

// Get route path with route groups stripped (for display)
export function getRoutePath(filePath: string, appDir: string): string {
  const relativePath = path.relative(appDir, filePath)
  const dirPath = path.dirname(relativePath)
  
  // Handle current directory case
  if (dirPath === '.' || dirPath === '') {
    return '/'
  }
  
  // Remove route groups from path
  const segments = dirPath.split(path.sep).filter((segment) => {
    return !ROUTE_GROUP_PATTERN.test(segment)
  })
  
  // Handle empty segments (all were route groups)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === '.')) {
    return '/'
  }
  
  return '/' + segments.join('/')
}

// Get file path with route groups kept (for layout matching)
function getFilePathWithGroups(filePath: string, appDir: string): string {
  const relativePath = path.relative(appDir, filePath)
  
  if (relativePath === '.' || relativePath === '') {
    return '/'
  }
  
  const segments = relativePath.split(path.sep).filter(s => s && s !== '.')
  
  if (segments.length === 0) {
    return '/'
  }
  
  return '/' + segments.join('/')
}

// Get layouts for a specific screen file (in order from root to leaf)
export function getLayoutsForScreen(screenFile: string, layoutFiles: string[], appDir: string): string[] {
  const layouts: Array<{ path: string, depth: number }> = []
  
  // Get the screen's directory path (with route groups kept)
  const screenDir = path.dirname(screenFile)
  const screenPath = getFilePathWithGroups(screenDir, appDir)
  
  for (const layoutFile of layoutFiles) {
    const layoutDir = path.dirname(layoutFile)
    const layoutPath = getFilePathWithGroups(layoutDir, appDir)
    
    // A layout applies if the screen path starts with the layout path
    if (screenPath === layoutPath ||
        screenPath.startsWith(layoutPath + '/') ||
        layoutPath === '/') {
      const depth = layoutPath === '/' ? 0 : layoutPath.split('/').filter(Boolean).length
      layouts.push({ path: layoutFile, depth })
    }
  }
  
  // Sort by depth (root layout first)
  return layouts.sort((a, b) => a.depth - b.depth).map(l => l.path)
}
