import { createRouter } from 'pen'

const routeFiles = ['page.tsx', 'about/page.tsx']
const [match, diagnostics] = createRouter(routeFiles)

if (diagnostics.length)
  console.log('diagnostics:', diagnostics)

for (const url of ['/', '/about', '/nope']) {
  const [hasPage, renderTree] = match(url)
  console.log(`\n${url} -> hasPage: ${hasPage}`)
  console.log(JSON.stringify(renderTree, null, 2))
}
