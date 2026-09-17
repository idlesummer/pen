import { createRouteTree } from '../compiler/route-tree'
import { createPositionTree } from '../compiler/position-tree'
import { matchPosition } from './index'
import { indent } from '@/lib/json-indent'

console.log(`
  app/
  ├── layout.tsx
  ├── page.tsx
  ├── @modal/page.tsx
  ├── dashboard/page.tsx
  └── blog/
      ├── [id]/
      │   ├── layout.tsx
      │   ├── page.tsx
      │   ├── default.tsx
      │   └── @related/page.tsx
      └── [...rest]/page.tsx
`)

const routeTree = createRouteTree([
  'layout.tsx',
  'page.tsx',
  '@modal/page.tsx',
  'dashboard/page.tsx',
  'blog/[id]/layout.tsx',
  'blog/[id]/page.tsx',
  'blog/[id]/default.tsx',
  'blog/[id]/@related/page.tsx',
  'blog/[...rest]/page.tsx',
])
const [root] = createPositionTree(routeTree)

function run(label: string, url: string[]) {
  console.log(`\n=== ${label}: /${url.join('/')} ===`)
  const match = matchPosition(root, url)
  console.log('content:', match.endpoint.content)
  console.log('params:', JSON.stringify(match.params))
  if (match.slots?.modal)
    console.log('modal slot content:', match.slots.modal.endpoint.content, 'params:', JSON.stringify(match.slots.modal.params))
}

run('root', [])
run('static', ['dashboard'])
run('dynamic - exact fit', ['blog', '42'])
run('dynamic dead-ends, backtracks to catchall', ['blog', '42', 'extra'])
run('nothing matches anywhere, falls back to root', ['totally', 'unknown'])

// The load-bearing check: @related sits under [id]'s slot, and paramDepth
// is continuous through it - so its match should inherit id, not start
// fresh. This is the same fixture/claim verified structurally in
// position-tree.demo.ts, now checked end to end through actual matching.
console.log('\n=== slot param inheritance: /blog/42 ===')
const blogMatch = matchPosition(root, ['blog', '42'])
console.log('page params:', JSON.stringify(blogMatch.params))
console.log('related slot params:', JSON.stringify(blogMatch.slots?.related?.params))
console.log('related slot content:', blogMatch.slots?.related?.endpoint.content)

console.log('\n=== full match result for /blog/42 ===')
console.log(JSON.stringify(...indent(blogMatch)))
