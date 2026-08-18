// Scratch space for poking at the routing pipeline by hand.
// Run with: npm run playground
//
// Edit filePaths to shape a route tree, edit urls to probe it, re-run.
import type { RenderNode } from '@/pen/routing'
import { sep } from 'node:path'
import { createRouter, getRoutePath } from '@/pen/routing'

// createRouteTree splits each path on node:path's platform sep ('\' on
// Windows), so these need converting from the '/'-written literals below -
// otherwise every path here comes through as a single unsplit component
// and the whole tree flattens onto root.
const toFilePath = (path: string) => path.split('/').join(sep)

/*
 * Route tree:
 *
 * /
 * ├── page.tsx
 * ├── layout.tsx
 * ├── about/
 * │   └── page.tsx
 * ├── blog/
 * │   ├── page.tsx
 * │   ├── layout.tsx
 * │   └── [slug]/
 * │       ├── page.tsx
 * │       └── not-found.tsx
 * ├── docs/
 * │   └── [...slug]/
 * │       └── page.tsx
 * ├── (marketing)/
 * │   └── pricing/
 * │       └── page.tsx
 * ├── dashboard/
 * │   ├── layout.tsx
 * │   ├── page.tsx
 * │   └── @sidebar/
 * │       ├── page.tsx
 * │       └── default.tsx
 * └── users/
 *     └── [id]/
 *         └── settings/
 *             └── page.tsx
 */
const filePaths = [
  'page.tsx',
  'layout.tsx',
  'about/page.tsx',
  'blog/page.tsx',
  'blog/layout.tsx',
  'blog/[slug]/page.tsx',
  'blog/[slug]/not-found.tsx',
  'docs/[...slug]/page.tsx',
  '(marketing)/pricing/page.tsx',
  '(marketing)/about/page.tsx', // collides with about/page.tsx -> duplicate-page-route diagnostic
  'dashboard/layout.tsx',
  'dashboard/page.tsx',
  'dashboard/@sidebar/page.tsx',
  'dashboard/@sidebar/default.tsx',
  'users/[id]/settings/page.tsx',
].map(toFilePath)

const urls = [
  '/',
  '/about',
  '/blog',
  '/blog/hello-world',
  '/docs/a/b/c',
  '/pricing',
  '/dashboard',
  '/users/42/settings',
  '/nope',
]

const [match, diagnostics] = createRouter(filePaths)

if (diagnostics.length) {
  console.log('route issues:')
  for (const issue of diagnostics)
    console.log(`  [${issue.severity}] ${issue.rule}: ${issue.message} (${issue.files.join(', ')})`)
  console.log()
}

function printRenderNode(node: RenderNode, indent: string): void {
  if (node.type === 'leaf') {
    const params = 'params' in node ? node.params : undefined
    const suffix = params && Object.keys(params).length ? ` ${JSON.stringify(params)}` : ''
    console.log(`${indent}${node.moduleType} <- /${getRoutePath(node.moduleRouteNode)}${suffix}`)
    return
  }

  const flags = [node.loading && 'loading', node.error && 'error'].filter(Boolean).join('+')
  console.log(`${indent}layout <- /${getRoutePath(node.moduleRouteNode)}${flags ? ` (${flags})` : ''}`)
  for (const [slotName, slotNode] of Object.entries(node.slots)) {
    console.log(`${indent}  [${slotName}]`)
    printRenderNode(slotNode, `${indent}    `)
  }
}

for (const url of urls) {
  const [hasPage, renderTree] = match(url)
  console.log(`${url} -> hasPage=${hasPage}`)
  if (renderTree) printRenderNode(renderTree, '  ')
  else console.log('  (no match at all)')
  console.log()
}
