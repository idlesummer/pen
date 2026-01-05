import { statSync } from 'fs'
import pc from 'picocolors'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

export const bytes = prettyBytes
export const duration = prettyMs

/** Display file paths in a two-column list with sizes and total */
export function fileList(paths: string[]): string {
  const WIDTH = 45
  const stats = paths.map(path => ({
    path: path.replace(/\\/g, '/'),
    size: statSync(path).size,
  }))

  const total = stats.reduce((sum, item) => sum + item.size, 0)
  const lines = stats.map(({ path, size }) => {
    const paddedPath = pc.cyan(path.padEnd(WIDTH))
    const formattedSize = pc.dim(bytes(size))
    return `  ${paddedPath}  ${formattedSize}`
  })

  const footerLabel = `${paths.length} files, total:`.padEnd(WIDTH)
  const footer = `  ${pc.dim(footerLabel)}  ${pc.dim(bytes(total))}`
  return [...lines, footer].join('\n')
}
