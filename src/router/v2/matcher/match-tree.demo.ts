import { createRouteTree } from '../compiler/route-tree'
import { createPositionTree } from '../compiler/position-tree'
import { match } from './match-tree'
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
  const result = match(root, url)
  console.log('content:', result.endpoint.content)
  console.log('params:', JSON.stringify(result.params))
  for (const [name, slot] of Object.entries(result.slots ?? {}))
    console.log(`${name} slot content:`, slot.endpoint.content, 'params:', JSON.stringify(slot.params))
}

run('root', [])
run('static', ['dashboard'])
// Also the load-bearing slot check: @related sits under [id]'s slot, and
// paramDepth is continuous through it - so its params should inherit id,
// not start fresh.
run('dynamic - exact fit', ['blog', '42'])
run('dynamic dead-ends, backtracks to catchall', ['blog', '42', 'extra'])
run('nothing matches anywhere, falls back to root', ['totally', 'unknown'])

console.log('\n=== full match result for /blog/42 ===')
console.log(JSON.stringify(...indent(match(root, ['blog', '42']))))
