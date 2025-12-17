import path from 'path'
import esbuild from 'esbuild'
import { getScreenFiles } from '@/cli/scanner'


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
  return screenFiles.map((file) => {
    const relativePath = path.relative(appDir, file)
    const jsPath = relativePath.replace(tsxPattern, '.js')
    return path.join(outDir, jsPath)
  })
}
