import { statSync } from 'fs'
import { join } from 'path'
import { fdir } from 'fdir'
import pc from 'picocolors'
import pm from 'picomatch'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

export const bytes = prettyBytes
export const duration = prettyMs

/** Display a list of files in a directory with their sizes */
export function fileList(baseDir: string, pattern = '**/*') {
  const WIDTH = 45

  // Find all files matching the pattern
  const files = new fdir()
    .withRelativePaths()
    .withGlobFunction(pm)  // ← Add this line
    .glob(pattern)
    .crawl(baseDir)
    .sync()

  const stats = files.map(path => {
    const fullPath = join(baseDir, path)
    const displayPath = path.replace(/\\/g, '/')
    return {
      path: displayPath,
      size: statSync(fullPath).size,
    }
  })

  const total = stats.reduce((sum, item) => sum + item.size, 0)
  const lines = stats.map(({ path, size }) => {
    const paddedPath = pc.cyan(path.padEnd(WIDTH))
    const formattedSize = pc.dim(bytes(size))
    return `  ${paddedPath}  ${formattedSize}`
  })

  const footerLabel = `${files.length} files, total:`.padEnd(WIDTH)
  const footer = `  ${pc.dim(footerLabel)}  ${pc.dim(bytes(total))}`
  return [...lines, footer].join('\n')
}
