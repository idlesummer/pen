import url from 'url'
import { compileScreens } from '@/cli/compiler'
import { getRoutePath } from '@/cli/scanner'

export async function loadAppFiles(appDir: string, tempDir: string) {
  const compiledFiles = await compileScreens(appDir, tempDir)
  const modules = []
  
  for (const filePath of compiledFiles) {
    const fileUrl = url.pathToFileURL(filePath).href + `?t=${Date.now()}`
    const module = await import(fileUrl)
    
    // Get route path with route groups stripped
    const routePath = getRoutePath(filePath, tempDir)
    console.log(`Loaded: ${routePath}`)
    
    if (module.default)
      console.log(`  ${module.default}`)
    modules.push(module)
  }
  
  return modules
}
