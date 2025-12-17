import path from 'path'
import esbuild from 'esbuild'
import { getScreenFiles } from '@/cli/scanner'


export async function compileScreens(appDir: string, outDir: string, isProd = false) {
  const screenFiles = await getScreenFiles(appDir)
  if (!screenFiles.length)
    return screenFiles
  
  await esbuild.build({
    entryPoints: screenFiles, // All screen.tsx files
    outdir: outDir,           // .pen/app/ or dist/app/
    outbase: appDir,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    jsx: 'automatic',         // react automatic JSX runtime
    jsxImportSource: 'react',
    bundle: false,            // don't bundle dependencies
    minify: isProd,           // minify if production
    sourcemap: !isProd,       // source maps for dev only
  })

  // Return compiled JS file paths
  const tsxPattern = /\.(tsx|jsx|ts)$/
  return screenFiles.map((file) => {
    const relativePath = path.relative(appDir, file)
    const jsPath = relativePath.replace(tsxPattern, '.js')
    return path.join(outDir, jsPath)
  })
}
