import { Route, validate, UrlNode, FileRouterError, RouteValidationErrors } from '../src/pen/routing'

// Usage: tsx scripts/test-builder [appDir] [--url | --tree=url]
const args = process.argv.slice(2)
const wantsUrl = args.includes('--url') || args.includes('--tree=url')
const appPath = args.find(arg => !arg.startsWith('-')) ?? 'scripts/mock-app'

try {
  const root = Route.read(appPath)
  const tree = wantsUrl ? UrlNode.project(root) : root
  console.log(JSON.stringify(tree, null, 2))

  // Report findings without throwing, so the tree is always inspectable.
  const errors = validate(root)
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
