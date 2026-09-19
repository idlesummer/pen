import { mount } from './.pen/generated/entry.ts'
import { componentMap } from './.pen/generated/component-map.ts'

function buildTree(paths) {
  const root = {}
  for (const path of paths) {
    let node = root
    for (const segment of path.split('/').filter(Boolean))
      node = node[segment] ??= {}
  }
  return root
}

function printTree(node, prefix = '') {
  const segments = Object.keys(node).sort()
  segments.forEach((segment, i) => {
    const isLast = i === segments.length - 1
    console.log(prefix + (isLast ? '└── ' : '├── ') + segment)
    printTree(node[segment], prefix + (isLast ? '    ' : '│   '))
  })
}

// Every real module across every role - layout.tsx, default.tsx, etc, not
// just pages. Sentinel paths (pen's built-in fallbacks) start with \0 and
// aren't real files, so they're excluded from what's meant to be a file tree.
const modulePaths = Object.values(componentMap)
  .flatMap(Object.keys)
  .filter(path => !path.startsWith('\0'))

console.log('Routes:')
console.log('/')
printTree(buildTree(modulePaths))

const { waitUntilExit } = mount()
await waitUntilExit()
