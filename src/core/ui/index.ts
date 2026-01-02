// src/core/ui/index.ts
import pc from 'picocolors'
import ora, { Ora } from 'ora'
import { statSync, readFileSync } from 'fs'
import { gzipSync } from 'zlib'
import { relative } from 'path'

// Box-drawing characters for tree formatting
const TREE = {
  branch: '├─',
  leaf: '└─',
  vertical: '│',
}

/**
 * Terminal UI utilities for CLI output.
 * Provides logging, spinners, file lists, and tree formatting.
 */
export const log = {
  /**
   * Info message with cyan color
   */
  info(message: string) {
    console.log(pc.cyan(`ℹ ${message}`))
  },

  /**
   * Success message with green color
   */
  success(message: string) {
    console.log(pc.green(`✔ ${message}`))
  },

  /**
   * Warning message with yellow color
   */
  warn(message: string) {
    console.log(pc.yellow(`⚠ ${message}`))
  },

  /**
   * Error message with red color
   */
  error(message: string) {
    console.log(pc.red(`✖ ${message}`))
  },

  /**
   * Create a spinner for long-running operations
   */
  spinner(text: string): Ora {
    return ora(text)
  },

  /**
   * Display files with sizes and gzipped sizes (like esbuild output)
   */
  files(files: string[], cwd: string = process.cwd()) {
    const fileStats = files.map(file => {
      const stat = statSync(file)
      const content = readFileSync(file)
      const gzipped = gzipSync(content)

      return {
        path: relative(cwd, file),
        size: stat.size,
        gzip: gzipped.length
      }
    })

    // Sort by size (largest first)
    fileStats.sort((a, b) => b.size - a.size)

    // Print each file
    for (const file of fileStats) {
      const sizeKB = (file.size / 1024).toFixed(2)
      const gzipKB = (file.gzip / 1024).toFixed(2)
      console.log(
        pc.cyan(`ℹ ${file.path.padEnd(50)} ${sizeKB.padStart(6)} kB │ gzip: ${gzipKB} kB`)
      )
    }

    // Summary line
    const totalSize = fileStats.reduce((sum, f) => sum + f.size, 0)
    const totalKB = (totalSize / 1024).toFixed(2)
    console.log(pc.cyan(`ℹ ${fileStats.length} files, total: ${totalKB} kB`))
  },

  /**
   * Display a tree structure
   * Can be a flat list or nested groups
   */
  tree(label: string, items: string[] | Record<string, string[]>) {
    console.log(label)

    // Simple flat list
    if (Array.isArray(items)) {
      items.forEach((item, i) => {
        const isLast = i === items.length - 1
        const symbol = isLast ? TREE.leaf : TREE.branch
        console.log(`${symbol} ${item}`)
      })
      return
    }

    // Nested groups
    const groupKeys = Object.keys(items)
    groupKeys.forEach((group, i) => {
      const isLastGroup = i === groupKeys.length - 1
      const groupSymbol = isLastGroup ? TREE.leaf : TREE.branch
      console.log(`${groupSymbol} ${pc.bold(group)}`)

      const groupItems = items[group]
      groupItems.forEach((item, j) => {
        const isLastItem = j === groupItems.length - 1
        const prefix = isLastGroup ? '  ' : `${TREE.vertical} `
        const itemSymbol = isLastItem ? TREE.leaf : TREE.branch
        console.log(`${prefix}${itemSymbol} ${item}`)
      })
    })
  }
}
