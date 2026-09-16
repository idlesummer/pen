import { createRouteTree } from './route-tree'
import { createPositionTree } from './position-tree'
import { validateConflicts } from './validate'

// Smallest tree that can show it: one static ancestor, one dynamic segment,
// one slot beneath it. blog wraps nothing of its own (no layout/default), so
// it earns no Frame at all - it only exists to push urlDepth and staticness
// apart (urlDepth 2, staticness -1 at [id]) instead of leaving them equal.
// [id] needs its own layout.tsx so it earns a Frame at all - otherwise there'd
// be nowhere for its `slots` field to attach to.
console.log(`
  app/
  └── blog/
      └── [id]/
          ├── layout.tsx
          ├── page.tsx
          └── @related/
              └── page.tsx
`)

const routeTree = createRouteTree([
  'blog/[id]/layout.tsx',
  'blog/[id]/page.tsx',
  'blog/[id]/@related/page.tsx',
])
const [root] = createPositionTree(routeTree)
console.log(JSON.stringify(root, null, 2))

// paramDepth/contentDepth continuity through a slot boundary: [id] binds one
// param, and @related sits in a slot directly beneath it. A slot must NOT
// reset the count - if it did (the old, wrong boundaryDepth-based behavior),
// @related's own paramDepth/contentDepth would read 0 below instead of 1.
// Verified against a real Next.js build: params flow straight through a slot.
const idPosition = root.statics!.blog!.dynamic!
const idFrame = idPosition.endpoint!.frames[1]!  // [id]'s own frame, wrapping page.tsx (frames[0] is root's implicit default)
const related = idFrame.slots!.related!
console.log('\nparamDepth/contentDepth through the @related slot:')
console.log('  [id] frame paramDepth:          ', idFrame.paramDepth)
console.log('  [id]/@related frame paramDepth: ', related.endpoint!.frames[0]!.paramDepth)
console.log('  [id]/@related contentDepth:     ', related.endpoint!.contentDepth)

// duplicate-default-route: (a)/dashboard and (b)/dashboard are group siblings,
// so they collapse onto the same position - but each declares its own real
// default.tsx, and nothing says which one should win. That used to be settled
// silently by traversal order; it should be a diagnostic instead.
console.log(`
  app/
  ├── (a)/
  │   └── dashboard/
  │       └── default.tsx
  └── (b)/
      └── dashboard/
          └── default.tsx
`)
const conflictTree = createRouteTree([
  '(a)/dashboard/default.tsx',
  '(b)/dashboard/default.tsx',
])
const [, conflicts] = createPositionTree(conflictTree)
console.log('diagnostics:', JSON.stringify(validateConflicts(conflicts), null, 2))
