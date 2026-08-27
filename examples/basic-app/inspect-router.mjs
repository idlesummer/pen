import { join } from 'node:path'
import { createRouter } from 'pen'

// createRouter splits each path on the platform's separator (\ on Windows,
// / elsewhere), so paths must use path.join, not a hardcoded '/'.
const routeFiles = ['page.tsx', join('about', 'page.tsx')]
const [match, diagnostics] = createRouter(routeFiles)

if (diagnostics.length)
  console.log('diagnostics:', diagnostics)

for (const url of ['/', '/about', '/nope']) {
  const [hasPage, renderTree] = match(url)
  console.log(`\n${url} -> hasPage: ${hasPage}`)
  console.log(JSON.stringify(renderTree, null, 2))
}
