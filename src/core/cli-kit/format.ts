// core/ui.ts
import { statSync } from 'fs'
import pc from 'picocolors'
/**
 * Display a list of files with their sizes
 */
export function files(files: string[]) {
  const fileStats = files.map(file => {
    const stat = statSync(file)
    return { path: file, size: stat.size }
  })

  const totalSize = fileStats.reduce((sum, f) => sum + f.size, 0)

  fileStats.forEach(({ path, size }) => {
    const formattedPath = pc.dim(path.padEnd(50))
    const formattedSize = pc.cyan(formatSize(size).padStart(10))
    console.log(`  ${formattedPath} ${formattedSize}`)
  })

  console.log(`  ${pc.dim(`${files.length} files, total:`).padEnd(50)} ${pc.cyan(formatSize(totalSize).padStart(10))}`)
}

/**
 * Display a tree structure
 */
export function tree(data: Record<string, string[]>) {
  Object.entries(data).forEach(([key, values]) => {
    if (key) console.log(pc.bold(key))

    values.forEach((value, index) => {
      const isLast = index === values.length - 1
      const prefix = isLast ? '└─' : '├─'
      console.log(`${prefix} ${value}`)
    })
  })
}

/**
 * Display a table
 */
export function table(headers: string[], rows: string[][]) {
  // Calculate column widths
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => r[i]?.length || 0)),
  )

  // Print header
  console.log(headers.map((h, i) => pc.bold(h.padEnd(widths[i]))).join('  '))
  console.log(widths.map(w => '─'.repeat(w)).join('  '))

  // Print rows
  rows.forEach(row => {
    console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '))
  })
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
