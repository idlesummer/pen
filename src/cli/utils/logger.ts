// cli/utils/log.ts
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
  indent: '  '
}

export const log = {
  // Basic logging
  info(message: string) {
    console.log(pc.cyan(`ℹ  ${message}`))
  },

  success(message: string) {
    console.log(pc.green(`✔ ${message}`))
  },

  warn(message: string) {
    console.log(pc.yellow(`⚠ ${message}`))
  },

  error(message: string) {
    console.log(pc.red(`✖ ${message}`))
  },

  // File list with sizes (like CommandKit build output)
  fileList(files: string[], cwd: string = process.cwd()) {
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

  // Simple tree (flat list)
  tree(label: string, items: string[]) {
    console.log(label)
    items.forEach((item, i) => {
      const isLast = i === items.length - 1
      const symbol = isLast ? TREE.leaf : TREE.branch
      console.log(`${symbol} ${item}`)
    })
  },

  // Nested tree (like CommandKit routes)
  nestedTree(label: string, groups: Record<string, string[]>) {
    console.log(label)
    const groupKeys = Object.keys(groups)

    groupKeys.forEach((group, i) => {
      const isLastGroup = i === groupKeys.length - 1
      const groupSymbol = isLastGroup ? TREE.leaf : TREE.branch
      console.log(`${groupSymbol} ${pc.bold(group)}`)

      const items = groups[group]
      items.forEach((item, j) => {
        const isLastItem = j === items.length - 1
        const prefix = isLastGroup ? '  ' : `${TREE.vertical} `
        const itemSymbol = isLastItem ? TREE.leaf : TREE.branch
        console.log(`${prefix}${itemSymbol} ${item}`)
      })
    })
  },

  // Create a spinner
  spinner(text: string): Ora {
    return ora(text)
  }
}
