import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRouter } from 'pen'

const appDir = join(dirname(fileURLToPath(import.meta.url)), 'app')

// Mirrors pen's own discoverFiles: readdirSync's recursive paths already use
// the platform separator createRouter expects, so no path.join juggling needed.
const routeFiles = readdirSync(appDir, { recursive: true, encoding: 'utf8' })
  .filter(path => path.endsWith('.tsx'))
  .sort()

console.log('routeFiles:', routeFiles)

const [match, diagnostics] = createRouter(routeFiles)

if (diagnostics.length)
  console.log('diagnostics:', diagnostics)

for (const url of ['/', '/about', '/nope']) {
  const [hasPage, renderTree] = match(url)
  console.log(`\n${url} -> hasPage: ${hasPage}`)
  console.log(JSON.stringify(renderTree, null, 2))
}
