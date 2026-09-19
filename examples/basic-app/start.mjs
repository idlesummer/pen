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
  const segments = Object.keys(node)
  segments.forEach((segment, i) => {
    const isLast = i === segments.length - 1
    console.log(prefix + (isLast ? '└── ' : '├── ') + segment)
    printTree(node[segment], prefix + (isLast ? '    ' : '│   '))
  })
}

console.log('Routes:')
console.log('/')
printTree(buildTree(Object.keys(componentMap.page).map(path => path.replace(/(^|\/)page\.tsx$/, ''))))

const { waitUntilExit } = mount()
await waitUntilExit()
