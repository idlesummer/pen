import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import esbuild from 'esbuild'


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

export async function compileScreens(appDir: string, outDir: string, isProd = false) {
  const screenFiles = await getScreenFiles(appDir)
  if (!screenFiles.length)
    return screenFiles
  
  await esbuild.build({
    entryPoints: screenFiles,
    outdir: outDir,
    outbase: appDir,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    jsx: 'automatic',
    jsxImportSource: 'react',
    bundle: false,
    minify: isProd,
    sourcemap: !isProd,
  })

  // Return compiled JS file paths
  const tsxPattern = /\.(tsx|jsx|ts)$/
  return screenFiles.map(file => {
    const relativePath = path.relative(appDir, file)
    const jsPath = relativePath.replace(tsxPattern, '.js')
    return path.join(outDir, jsPath)
  })
}

export async function loadAppFiles(appDir: string, tempDir: string) {
  const compiledFiles = await compileScreens(appDir, tempDir)
  const modules = []
  
  for (const filePath of compiledFiles) {
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
