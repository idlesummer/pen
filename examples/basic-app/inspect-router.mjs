import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRouter } from '@idlesummer/pen'

const appDir = join(dirname(fileURLToPath(import.meta.url)), 'app')

// Mirrors pen's own findFiles: readdirSync's recursive paths already use
// the platform separator createRouter expects, so no path.join juggling needed.
// createRouter filters non-route-module files internally, so a plain
// extension filter is all this needs to do.
const routeFiles = readdirSync(appDir, { recursive: true, encoding: 'utf8' })
  .filter(path => path.endsWith('.tsx'))
  .sort()

console.log('routeFiles:', routeFiles)
const [match, diagnostics, routeTree] = createRouter(routeFiles)

if (diagnostics.length)
  console.log('diagnostics:', diagnostics)
else
  console.log('No errors.')

// routeTree is the actual nested tree - readdirSync only ever gives a flat
// list, this is what turns that into structure. `parent` is dropped since
// each node also points back up, which JSON.stringify can't follow.
console.log('\nrouteTree:', JSON.stringify(routeTree, (key, value) => key === 'parent' ? undefined : value, 2))

for (const url of ['/', '/home', '/home/about', '/nope']) {
  const renderTree = match(url)
  console.log(`\n${url} ->`)
  console.log(JSON.stringify(renderTree, null, 2))
}
