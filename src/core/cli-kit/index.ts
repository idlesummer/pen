import { statSync } from 'fs'
import { relative } from 'path'
import ora from 'ora'
import pc from 'picocolors'

const { bgCyan, bgGreen, bgYellow, bgRed, cyan, white, bold } = pc
const TREE = { branch: '├─', leaf: '└─', vertical: '│' } as const

/** Info message with cyan color */
export function info(message: string) {
  console.log(`${bgCyan(white(bold(' [INFO] ')))} ${message}`)
}

/** Success message with green color */
export function success(message: string) {
  console.log(`${bgGreen(white(bold(' [SUCCESS] ')))} ${message}`)
}

/** Warning message with yellow color */
export function warn(message: string) {
  console.log(`${bgYellow(white(bold(' [WARN] ')))} ${message}`)
}

/** Error message with red color */
export function error(message: string) {
  console.log(`${bgRed(white(bold(' [ERROR] ')))} ${message}`)
}

/** Create a spinner for long-running operations */
export function spinner(text: string) {
  return ora(text)
}

/** Display files with sizes */
export function files(filepaths: string[], cwd = process.cwd()) {
  const fileStats = filepaths.map(filepath => {
    return {
      path: relative(cwd, filepath).replace(/\\/g, '/'),
      size: statSync(filepath).size,
    }
  })

  fileStats.sort((a, b) => b.size - a.size)

  for (const file of fileStats) {
    const sizeKB = (file.size / 1024).toFixed(2)
    console.log(cyan(`  ${file.path.padEnd(50)} ${sizeKB.padStart(6)} kB`))
  }

  const totalSize = fileStats.reduce((sum, f) => sum + f.size, 0)
  const totalKB = (totalSize / 1024).toFixed(2)
  const summary = `${fileStats.length} files, total:`
  console.log(cyan(`  ${summary.padEnd(50)} ${totalKB.padStart(6)} kB`))
}

/** Display a tree structure */
export function tree(groups: Record<string, string[]>) {
  const groupKeys = Object.keys(groups)

  for (let i = 0; i < groupKeys.length; i++) {
    const group = groupKeys[i]
    const items = groups[group]
    const isLastGroup = i === groupKeys.length - 1

    // If group name is empty, just print items (flat tree)
    if (group === '') {
      printList(items)
    } else {
      const groupSymbol = isLastGroup ? TREE.leaf : TREE.branch
      console.log(`${groupSymbol} ${bold(group)}`)
      printGroupItems(items, isLastGroup)
    }
  }
}

function printList(items: string[]) {
  for (let i = 0; i < items.length; i++) {
    const symbol = i === items.length - 1 ? TREE.leaf : TREE.branch
    console.log(`${symbol} ${items[i]}`)
  }
}

function printGroupItems(items: string[], isLastGroup: boolean) {
  const prefix = isLastGroup ? '  ' : `${TREE.vertical} `

  for (let i = 0; i < items.length; i++) {
    const symbol = i === items.length - 1 ? TREE.leaf : TREE.branch
    console.log(`${prefix}${symbol} ${items[i]}`)
  }
}
