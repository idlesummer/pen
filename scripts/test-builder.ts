import { readRouteTree } from '../src/pen/routing/builder.ts'
import { validateRouteTree, validateUrlTree } from '../src/pen/routing/internals/validate.ts'
import UrlNode from '../src/pen/routing/internals/url-node.ts'
import { FileRouterError, RouteValidationErrors } from '../src/pen/routing/errors.ts'

// Usage: tsx scripts/test-builder.ts [appDir] [--url | --tree=url]
const args = process.argv.slice(2)
const wantsUrl = args.includes('--url') || args.includes('--tree=url')
const appPath = args.find(arg => !arg.startsWith('-')) ?? 'scripts/mock-app'

try {
  const root = readRouteTree(appPath)
  const tree = wantsUrl ? UrlNode.project(root) : root
  console.log(JSON.stringify(tree, null, 2))

  // Report findings without throwing, so the tree is always inspectable.
  const errors = [...validateRouteTree(root), ...validateUrlTree(root)]
  if (errors.length) {
    console.error('\n' + new RouteValidationErrors(errors).message)
    process.exitCode = 1
  }
} catch (err) {
  if (err instanceof FileRouterError) {
    console.error(err.message)
    process.exitCode = 1
  } else {
    throw err
  }
}
