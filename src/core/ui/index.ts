import { statSync, readFileSync } from 'fs'
import { relative } from 'path'
import ora from 'ora'
import pc from 'picocolors'
import { gzipSync } from 'zlib'

const { bgCyan, bgGreen, bgYellow, bgRed, cyan, white, black, bold } = pc
const TREE = { branch: '├─', leaf: '└─', vertical: '│' } as const

/** Info message with cyan color */
export function info(message: string) {
  console.log(`${bgCyan(white(' INFO '))} ${message}`)
}

/** Success message with green color */
export function success(message: string) {
  console.log(`${bgGreen(white(' SUCCESS '))} ${message}`)
}

/** Warning message with yellow color */
export function warn(message: string) {
  console.log(`${bgYellow(black(' WARN '))} ${message}`)
}

/** Error message with red color */
export function error(message: string) {
  console.log(`${bgRed(white(' ERROR '))} ${message}`)
}

/** Create a spinner for long-running operations */
export function spinner(text: string) {
  return ora(text)
}

/** Display files with sizes and gzipped sizes */
export function files(filepaths: string[], cwd = process.cwd()) {
  const fileStats = filepaths.map(filepath => {
    const stat = statSync(filepath)
    const content = readFileSync(filepath)
    const gzipped = gzipSync(content)

    return {
      path: relative(cwd, filepath),
      size: stat.size,
      gzip: gzipped.length,
    }
  })

  fileStats.sort((a, b) => b.size - a.size)

  for (const file of fileStats) {
    const sizeKB = (file.size / 1024).toFixed(2)
    const gzipKB = (file.gzip / 1024).toFixed(2)
    console.log(cyan(`i ${file.path.padEnd(50)} ${sizeKB.padStart(6)} kB │ gzip: ${gzipKB} kB`))
  }

  const totalSize = fileStats.reduce((sum, f) => sum + f.size, 0)
  const totalKB = (totalSize / 1024).toFixed(2)
  console.log(cyan(`i ${fileStats.length} files, total: ${totalKB} kB`))
}

/** Display a tree structure (flat list or nested groups) */
export function tree(label: string, items: string[] | Record<string, string[]>) {
  console.log(label)

  if (Array.isArray(items))
    printFlatTree(items)
  else
    printNestedTree(items)
}

function printFlatTree(items: string[]) {
  for (let i = 0; i < items.length; i++) {
    const symbol = i === items.length - 1 ? TREE.leaf : TREE.branch
    console.log(`${symbol} ${items[i]}`)
  }
}

function printNestedTree(groups: Record<string, string[]>) {
  const groupKeys = Object.keys(groups)

  for (let i = 0; i < groupKeys.length; i++) {
    const group = groupKeys[i]
    const isLastGroup = i === groupKeys.length - 1
    const groupSymbol = isLastGroup ? TREE.leaf : TREE.branch

    console.log(`${groupSymbol} ${bold(group)}`)
    printGroupItems(groups[group], isLastGroup)
  }
}

function printGroupItems(items: string[], isLastGroup: boolean) {
  const prefix = isLastGroup ? '  ' : `${TREE.vertical} `

  for (let i = 0; i < items.length; i++) {
    const symbol = i === items.length - 1 ? TREE.leaf : TREE.branch
    console.log(`${prefix}${symbol} ${items[i]}`)
  }
}
