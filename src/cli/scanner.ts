import { readdirSync } from 'fs'
import { join, relative, sep } from 'path'


export interface RouteFile {
  path: string           // Full file path: src/app/users/[id].tsx
  route: string          // Route path: /users/:id
  filePath: string       // Relative path: users/[id].tsx
}

// Only process .tsx, .ts, .jsx, .js files
const routeFilePattern = /\.(tsx?|jsx?)$/ 

export function scanRoutes(appDir: string): RouteFile[] {
  const routes: RouteFile[] = []
  const dirents = readdirSync(appDir, { recursive: true, withFileTypes: true })
  
  for (const dirent of dirents) {
    if (!dirent.isFile()) continue
    if (!routeFilePattern.test(dirent.name)) continue

    // Use parentPath if available, otherwise construct manually
    const parentPath = dirent.parentPath
    const fullPath = join(parentPath, dirent.name)
    const relativePath = relative(appDir, fullPath)
    
    // Skip private directories (any path segment starting with _)
    // Skip route groups (wrapped in parentheses)
    const segments = relativePath.split(sep)
    const hasPrivate = segments.some(s => s.startsWith('_'))
    const hasGroup = segments.some(s => s.startsWith('(') && s.endsWith(')'))
    if (hasPrivate || hasGroup)
      continue
    
    const routePath = filePathToRoute(relativePath)
    routes.push({
      path: fullPath,
      route: routePath,
      filePath: relativePath,
    })
  }
  return routes
}

function filePathToRoute(filePath: string): string {
  // Remove file extension
  let route = filePath.replace(routeFilePattern, '')
  
  // Convert Windows paths to forward slashes
  route = route.split(sep).join('/')
  
  // Convert index to root
  if (route.endsWith('/index') || route === 'index')
    route = route.replace(/\/?index$/, '')
  
  // Convert [id] to :id (dynamic segments)
  route = route.replace(/\[([^\]]+)\]/g, ':$1')
  
  // Ensure starts with /
  route = '/' + route
  
  // Clean up double slashes
  route = route.replace(/\/+/g, '/')
  
  // Root route should be just /
  if (route === '/') return '/'
  
  // Remove trailing slash
  return route.replace(/\/$/, '')
}
